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
import { useNova } from "nova-react-sdk"; // <-- Nova SDK integration

import {
  requestNotificationPermission,
  getFCMToken,
  setupNotificationHandlers,
  setupTokenRefreshListener
} from "../components/common/notificationService";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider initialized");

  // Nova SDK: Get setUser & experience loader with enhanced functionality
  const { 
    setUser: setNovaUser, 
    loadAllExperiences, 
    state: novaState,
    updateUserProfile: updateNovaProfile 
  } = useNova();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [hasMcVerification, setHasMcVerification] = useState(false);
  const [fcmToken, setFcmToken] = useState("");

  // Enhanced Nova user sync function
  const syncUserWithNova = async (userData, firestoreData) => {
    try {
      console.log("🔄 Starting Nova user sync...");
      console.log("📊 User data:", {
        email: userData.email,
        displayName: userData.displayName,
        hasMcVerified: firestoreData?.hasMcVerified || false,
        coinBalance: firestoreData?.coinBalance || 0,
        mcUsername: firestoreData?.mcUsername || null
      });

      // Set Nova user with comprehensive profile
      const novaUserProfile = {
        displayName: userData.displayName,
        hasMcVerified: firestoreData?.hasMcVerified || false,
        coinBalance: firestoreData?.coinBalance || 0,
        mcUsername: firestoreData?.mcUsername || null,
        userType: firestoreData?.hasMcVerified ? 'verified' : 'unverified',
        lastLogin: new Date().toISOString(),
        platform: 'mobile',
        appVersion: '1.0.0'
      };

      console.log("🎯 Setting Nova user with profile:", novaUserProfile);
      
      await setNovaUser({
        userId: userData.email,
        userProfile: novaUserProfile
      });

      console.log("✅ Nova user set successfully");
      console.log("🆔 Nova internal userId:", novaState.user?.novaUserId);

      // Load all experiences for the user
      console.log("🚀 Loading all Nova experiences...");
      const experiences = await loadAllExperiences();
      console.log("📦 Experiences loaded:", experiences);

      // Log the current Nova state after sync
      console.log("🔍 Current Nova state:", {
        userId: novaState.user?.userId,
        novaUserId: novaState.user?.novaUserId,
        userProfile: novaState.user?.userProfile,
        experiences: novaState.experiences,
        loading: novaState.loading,
        error: novaState.error
      });

      return true;
    } catch (error) {
      console.error("❌ Nova user sync failed:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      return false;
    }
  };

  // Real-time Nova experience monitoring
  useEffect(() => {
    if (novaState.experiences && Object.keys(novaState.experiences).length > 0) {
      console.log("🎨 Nova experiences updated in real-time:");
      Object.entries(novaState.experiences).forEach(([expName, expData]) => {
        console.log(`  📱 ${expName}:`, expData);
      });
    }
  }, [novaState.experiences]);

  // Monitor Nova user state changes
  useEffect(() => {
    if (novaState.user) {


      console.log("👤 Nova user state changed:", {
        externalUserId: novaState.user.userId,
        novaUserId: novaState.user.novaUserId,
        profile: novaState.user.userProfile
      });
    }
  }, [novaState.user]);

  // Monitor Nova loading states
  useEffect(() => {
    if (novaState.loading) {
      console.log("⏳ Nova is loading experiences...");
    }
  }, [novaState.loading]);

  // Monitor Nova errors
  useEffect(() => {
    if (novaState.error) {
      console.error("🚨 Nova error detected:", novaState.error);
    }
  }, [novaState.error]);

  // -- Notification setup left unchanged --
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

  // Restore user session from AsyncStorage
  useEffect(() => {
    console.log("Setting up auth and checking stored user");
    configureGoogleSignIn();
    restoreUser();
  }, []);

  // Notification setup for new user
  useEffect(() => {
    if (user && user.email) {
      setupNotifications(user.email);
    }
  }, [user]);

  // ------- Main session restore logic ----------
  const restoreUser = async () => {
    try {
      console.log("Attempting to restore user session");
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        console.log("Found stored user data");
        const parsedUser = JSON.parse(userData);
        if (!parsedUser.email) {
          console.error("Invalid stored user data");
          await AsyncStorage.removeItem("user");
          return;
        }
        console.log("Fetching fresh data from Firestore for:", parsedUser.email);
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
              console.log("Giving daily reward");
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
              console.log("Daily reward given, new balance:", newBalance);
            }
          }

          const updatedUser = {
            ...parsedUser,
            ...firestoreData,
          };
          console.log("User session restored successfully");
          setUser(updatedUser);
          setIsLoggedIn(true);
          setHasMcVerification(firestoreData.hasMcVerified || false);

          // ---------- Enhanced Nova integration for real-time experience sync ----------
          await syncUserWithNova(updatedUser, firestoreData);
          // ---------------------------------------------

          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          setupNotifications(updatedUser.email);
        } else {
          console.log("No Firestore data found for user");
          await AsyncStorage.removeItem("user");
        }
      } else {
        console.log("No stored user session found");
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      await AsyncStorage.removeItem("user");
    }
  };

  // --- Google Sign-In Process ---
  const signInWithGoogle = async () => {
    try {
      const { isMaintenanceMode } = false;
      if (isMaintenanceMode) {
        throw new Error("App is under maintenance");
      }
      console.log("Starting Google Sign In process");
      const userCredential = await firebaseSignInWithGoogle();
      const token = await getFCMToken();

      const userData = {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        fcmToken: token,
      };
      console.log("Google Sign In successful:", userData.email);

      // Get/Create Firestore user doc
      let firestoreData = await getUserData(userData.email);
      if (!firestoreData) {
        console.log("New user - creating Firestore record");
        await saveUserToFirestore(userData);
        firestoreData = await getUserData(userData.email);
      } else {
        console.log("Existing user found in Firestore");
      }

      // Check for daily reward on sign in
      if (firestoreData && firestoreData.hasMcVerified) {
        const now = new Date().getTime();
        const lastReward = firestoreData.lastRewardTimestamp || 0;
        const hoursSinceLastReward = (now - lastReward) / (1000 * 60 * 60);
        if (hoursSinceLastReward >= 24) {
          console.log("Giving daily reward on sign in");
          const newBalance = (firestoreData.coinBalance || 0) + 15;
          const userRef = doc(db, "users", userData.email);
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
          console.log("Daily reward given on sign in, new balance:", newBalance);
        }
      }

      const completeUserData = {
        ...userData,
        ...firestoreData,
      };

      console.log("Saving user data to AsyncStorage");
      await AsyncStorage.setItem("user", JSON.stringify(completeUserData));
      setUser(completeUserData);
      setIsLoggedIn(true);
      setHasMcVerification(firestoreData?.hasMcVerified || false);
      
      // ---------- Enhanced Nova integration for real-time experience sync ----------
      await syncUserWithNova(userData, firestoreData);
      // -----------------------------------------------------

      setupNotifications(userData.email);
      console.log("Sign in process completed");
      return true;
    } catch (error) {
      console.error("Google Sign-In error:", error);
      return false;
    }
  };

  // --- Sign Out process ---
  const signOut = async () => {
    try {
      console.log("Starting sign out process");
      await firebaseSignOutUser();
      await AsyncStorage.clear();
      setUser(null);
      setIsLoggedIn(false);
      setHasMcVerification(false);
      setFcmToken("");
      
      // ---- Enhanced Nova SDK: set guest user and reload experiences ----
      try {
        console.log("🔄 Setting Nova guest user...");
        await setNovaUser({
          userId: "guest_" + Date.now(),
          userProfile: { 
            cohort: "guest",
            userType: "guest",
            lastLogin: new Date().toISOString(),
            platform: "mobile"
          }
        });
        await loadAllExperiences();
        console.log("✅ Experiences loaded for guest user");
      } catch (error) {
        console.error("❌ Nova setUser failed:", error);
      }
      // --------------------------------------------------------
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  // Function to update Nova user profile when user data changes
  const updateNovaUserProfile = async (updates) => {
    if (!user?.email) {
      console.log("No user logged in, skipping Nova profile update");
      return;
    }

    try {
      console.log("🔄 Updating Nova user profile with:", updates);
      await updateNovaProfile(updates);
      console.log("✅ Nova user profile updated successfully");
    } catch (error) {
      console.error("❌ Failed to update Nova user profile:", error);
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
        updateNovaUserProfile, // Expose Nova profile update function
        novaState, // Expose Nova state for debugging
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
