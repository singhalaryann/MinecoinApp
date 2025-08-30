import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  configureGoogleSignIn,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
  saveUserToFirestore,
  getUserData,
  updateFCMToken,
  checkMaintenanceMode,
} from "../config/firebase";
import { doc, updateDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNova } from "nova-react-sdk";

import { 
  requestNotificationPermission, 
  getFCMToken, 
  setupNotificationHandlers, 
  setupTokenRefreshListener 
} from "../components/common/notificationService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider initialized");
  
  // UPDATED: Get both setUser and loadAllExperiences from Nova
  const { setUser: setNovaUser, loadAllExperiences, trackEvent } = useNova();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [hasMcVerification, setHasMcVerification] = useState(false);
  const [fcmToken, setFcmToken] = useState("");
  // UPDATED: Simplified Nova loading state since we have theme caching
  const [isNovaReady, setIsNovaReady] = useState(false);
  // NEW: Simple state to control theme source
  const [useStaticTheme, setUseStaticTheme] = useState(true);

  const setupNotifications = async (userEmail) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          if (userEmail) {
            await updateFCMToken(userEmail, token);
          }
        }

        const notificationUnsubscribe = setupNotificationHandlers();
        const tokenUnsubscribe = await setupTokenRefreshListener(userEmail);

        console.log("Token refresh listener attached for:", userEmail);

        return () => {
          notificationUnsubscribe();
          if (tokenUnsubscribe) tokenUnsubscribe();
        };
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  // UPDATED: Simplified Nova setup since theme caching handles the heavy lifting
  const setNovaUserAndWait = async (userData) => {
    try {
      console.log("🔄 Starting Nova setup process...");
      console.log("📝 Setting Nova user:", userData.userId);

      

      // Set Nova user first
      await setNovaUser(userData);
      console.log("✅ Nova user set successfully");

      // Load experiences
      console.log("🔄 Loading Nova experiences...");
      await loadAllExperiences();
      console.log("✅ Nova experiences loaded");

      // UPDATED: Shorter wait since theme caching will show theme immediately
      console.log("🔄 Short delay to ensure Nova is ready...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("🎉 Marking Nova as ready!");
      setIsNovaReady(true);
      // Check if 'guest' is present anywhere in userId string
      if (userData.userId && userData.userId.includes("guest")) {
        setUseStaticTheme(true);
      } else {
        setUseStaticTheme(false);
      }
      console.log("✅ Nova setup completed successfully!");

    } catch (error) {
      console.error("❌ Nova setup failed:", error);
      console.log("⚠️ Marking Nova as ready anyway to prevent infinite loading");
      setIsNovaReady(true);
    }
  };

  useEffect(() => {
    console.log("Setting up auth and checking stored user");
    configureGoogleSignIn();
    restoreUser();
  }, []);

  useEffect(() => {
    if (user && user.email) {
      setupNotifications(user.email);
    }
  }, [user]);

  const restoreUser = async () => {
    try {
      console.log("🔄 Attempting to restore user session");
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        console.log("✅ Found stored user data");
        const parsedUser = JSON.parse(userData);

        if (!parsedUser.email) {
          console.error("❌ Invalid stored user data");
          await AsyncStorage.removeItem("user");
          return;
        }

        console.log("🔄 Fetching fresh data from Firestore for:", parsedUser.email);
        let firestoreData = await getUserData(parsedUser.email);

        if (firestoreData) {
          // Check and give daily reward based on IST date
          if (firestoreData.hasMcVerified) {
            const toISTDate = (timestamp) =>
              new Date(timestamp).toLocaleDateString("en-GB", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });

            const now = Date.now();
            const lastReward = firestoreData.lastRewardTimestamp || 0;

            if (toISTDate(now) !== toISTDate(lastReward)) {
              console.log("🎁 Giving daily reward");
              const newBalance = (firestoreData.coinBalance || 0) + 20;
              const userRef = doc(db, "users", parsedUser.email);

              await updateDoc(userRef, {
                coinBalance: newBalance,
                lastRewardTimestamp: now,
              });

              firestoreData = {
                ...firestoreData,
                coinBalance: newBalance,
                lastRewardTimestamp: now,
              };

              if (firestoreData.mcUsername) {
                const playerRef = doc(db, "players", firestoreData.mcUsername);
                await updateDoc(playerRef, {
                  coinBalance: newBalance,
                });
              }

              console.log("✅ Daily reward given, new balance:", newBalance);
            }
          }

          const updatedUser = {
            ...parsedUser,
            ...firestoreData,
          };
          console.log("✅ User session restored successfully");

          setUser(updatedUser);
          setIsLoggedIn(true);
          setHasMcVerification(firestoreData.hasMcVerified || false);

          // UPDATED: Use new function to set Nova user and wait
          console.log("🔄 Setting up Nova for restored user...");
          await setNovaUserAndWait({
            userId: updatedUser.email,
            userProfile: {
              displayName: updatedUser.displayName,
              hasMcVerified: firestoreData.hasMcVerified || false,
              coinBalance: firestoreData.coinBalance || 0,
            }
          });
          
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          setupNotifications(updatedUser.email);
          
          // Track daily reward event AFTER Nova user is set
          if (firestoreData.hasMcVerified && firestoreData.coinBalance > (firestoreData.coinBalance - 20)) {
            try {
              await trackEvent("daily_reward_claimed", {
                user_id: updatedUser.email,
                reward_amount: 20,
                new_balance: firestoreData.coinBalance,
                source: "session_restoration"
              });
            } catch (error) {
              console.error("Failed to track daily reward event:", error);
            }
          }
          
          // Track session restoration event AFTER Nova user is set
          try {
            await trackEvent("session_restored", {
              user_id: updatedUser.email,
              has_mc_verified: firestoreData.hasMcVerified || false,
              coin_balance: firestoreData.coinBalance || 0,
              restoration_method: "async_storage"
            });
          } catch (error) {
            console.error("Failed to track session restoration event:", error);
          }
        } else {
          console.log("❌ No Firestore data found for user");
          await AsyncStorage.removeItem("user");
        }
      } else {
        console.log("ℹ️ No stored user session found");
        // NEW: Set Nova guest user for non-logged in users
        console.log("🔄 Setting up Nova guest user...");
        const guestUserId = "guest_" + Date.now();
        await setNovaUserAndWait({
          userId: guestUserId,
          userProfile: { cohort: "guest" }
        });
        
        // Track guest user creation event AFTER Nova user is set
        try {
          await trackEvent("guest_user_created", {
            user_id: guestUserId,
            creation_reason: "no_stored_session"
          });
        } catch (error) {
          console.error("Failed to track guest user creation event:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error restoring user:", error);
      await AsyncStorage.removeItem("user");
      // NEW: Set Nova guest user on error
      console.log("🔄 Setting up Nova guest user due to error...");
      const errorGuestUserId = "guest_" + Date.now();
      await setNovaUserAndWait({
        userId: errorGuestUserId,
        userProfile: { cohort: "guest" }
      });
      
      // Track error event AFTER Nova user is set
      try {
        await trackEvent("session_restoration_error", {
          user_id: errorGuestUserId,
          error_message: error.message,
          error_stack: error.stack,
          fallback_action: "guest_user_created"
        });
      } catch (trackError) {
        console.error("Failed to track error event:", trackError);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { isMaintenanceMode } = false;
      if (isMaintenanceMode) {
        throw new Error("App is under maintenance");
      }

      console.log("🔄 Starting Google Sign In process");
      const userCredential = await firebaseSignInWithGoogle();
      
      const token = await getFCMToken();
      
      const userData = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        fcmToken: token
      };
      console.log("✅ Google Sign In successful:", userData.email);

      console.log("🔄 Checking existing Firestore data");
      let firestoreData = await getUserData(userData.email);
      
      if (!firestoreData) {
        console.log("🆕 New user - creating Firestore record");
        await saveUserToFirestore(userData);
        firestoreData = await getUserData(userData.email);
      } else {
        console.log("✅ Existing user found in Firestore");
      }

      // Check for daily reward on sign in
      if (firestoreData && firestoreData.hasMcVerified) {
        const now = new Date().getTime();
        const lastReward = firestoreData.lastRewardTimestamp || 0;
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
        
        if (hoursSinceLastReward >= 24) {
          console.log("🎁 Giving daily reward on sign in");
          const newBalance = (firestoreData.coinBalance || 0) + 15;
          const userRef = doc(db, "users", userData.email);
          
          await updateDoc(userRef, {
            coinBalance: newBalance,
            lastRewardTimestamp: now
          });
          
          firestoreData = {
            ...firestoreData,
            coinBalance: newBalance,
            lastRewardTimestamp: now
          };

          if (firestoreData.mcUsername) {
            const playerRef = doc(db, "players", firestoreData.mcUsername);
            await updateDoc(playerRef, {
              coinBalance: newBalance
            });
          }

          console.log("✅ Daily reward given on sign in, new balance:", newBalance);
        }
      }

      const completeUserData = {
        ...userData,
        ...firestoreData
      };

      console.log("💾 Saving user data to AsyncStorage");
      await AsyncStorage.setItem("user", JSON.stringify(completeUserData));
      
      setUser(completeUserData);
      setIsLoggedIn(true);
      setHasMcVerification(firestoreData?.hasMcVerified || false);
      
      // UPDATED: Use new function to set Nova user and wait
      console.log("🔄 Setting up Nova for signed in user...");
      await setNovaUserAndWait({
        userId: userData.email,
        userProfile: {
          displayName: userData.displayName,
          hasMcVerified: firestoreData?.hasMcVerified || false,
          coinBalance: firestoreData?.coinBalance || 0,
        }
      });
      
      setupNotifications(userData.email);
      
      // Track events AFTER Nova user is set
      if (!firestoreData) {
        // Track new user sign up event
        try {
          await trackEvent("new_user_signup", {
            user_id: userData.email,
            display_name: userData.displayName,
            signup_method: "google",
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to track new user signup event:", error);
        }
      } else {
        // Track returning user sign in event
        try {
          await trackEvent("returning_user_signin", {
            user_id: userData.email,
            display_name: userData.displayName,
            signin_method: "google",
            has_mc_verified: firestoreData.hasMcVerified || false,
            coin_balance: firestoreData.coinBalance || 0,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to track returning user signin event:", error);
        }
      }
      
      // Track daily reward event if given
      if (firestoreData && firestoreData.hasMcVerified && firestoreData.coinBalance > (firestoreData.coinBalance - 15)) {
        try {
          await trackEvent("daily_reward_claimed", {
            user_id: userData.email,
            reward_amount: 15,
            new_balance: firestoreData.coinBalance,
            source: "signin_reward"
          });
        } catch (error) {
          console.error("Failed to track daily reward event:", error);
        }
      }
      
      console.log("🎉 Sign in process completed successfully!");
      return true;
    } catch (error) {
      console.error("❌ Google Sign-In error:", error);
      
      // For signin errors, we can't track with user context, so we'll track as guest
      // This is a limitation but ensures we don't break the Nova SDK requirement
      try {
        // Set a temporary guest user to track the error
        const tempGuestId = "guest_" + Date.now();
        await setNovaUserAndWait({
          userId: tempGuestId,
          userProfile: { cohort: "guest", error_context: "signin_failure" }
        });
        
        await trackEvent("signin_error", {
          user_id: tempGuestId,
          error_message: error.message,
          signin_method: "google",
          timestamp: new Date().toISOString()
        });
      } catch (trackError) {
        console.error("Failed to track signin error event:", trackError);
      }
      
      return false;
    }
  };

  const signOut = async () => {
    try {
      console.log("🔄 Starting sign out process");
      
      await firebaseSignOutUser();
      
      
      setUser(null);
      setIsLoggedIn(false);
      setHasMcVerification(false);
      setFcmToken("");
      
      // NEW: Reset Nova ready state and set guest user
      console.log("🔄 Resetting Nova state and setting guest user...");
      setIsNovaReady(false);
      await AsyncStorage.clear();

      const guestUserId = "guest_" + Date.now();
      await setNovaUserAndWait({
        userId: guestUserId,
        userProfile: { cohort: "guest" }
      });
      
      // Track sign out event AFTER Nova guest user is set
      if (user && user.email) {
        try {
          await trackEvent("user_signout", {
            user_id: user.email,
            signout_method: "manual",
            session_duration: Date.now() - (user.lastSignInTime || Date.now()),
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to track signout event:", error);
        }
      }
      
      console.log("✅ Sign out completed successfully");
    } catch (error) {
      console.error("❌ Sign-out error:", error);
      
      // Track sign out error event AFTER Nova guest user is set
      try {
        await trackEvent("signout_error", {
          user_id: guestUserId,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (trackError) {
        console.error("Failed to track signout error event:", trackError);
      }
      
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        hasMcVerification,
        signInWithGoogle,
        signOut,
        fcmToken,
        // NEW: Expose Nova ready state
        isNovaReady,
        // NEW: Expose theme control state
        useStaticTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;