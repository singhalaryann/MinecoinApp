import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { doc,setDoc, updateDoc, getDoc, arrayUnion, onSnapshot,increment, } from "firebase/firestore";
import { db } from "../config/firebase";
import _ from 'lodash';
import { useNova } from "nova-react-sdk";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const isInitialMount = useRef(true);
  if (isInitialMount.current) {
    console.log("UserProvider initialized");
    isInitialMount.current = false;
  }  
  
  const { updateUserProfile, trackEvent } = useNova();
  const { isLoggedIn, user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [hasMcVerified, setHasMcVerified] = useState(false);
  const [mcCredentials, setMcCredentials] = useState({
    username: "",
    password: "",
  });
  const [linkedPlayer, setLinkedPlayer] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const lastBalanceRef = useRef(null);
  const isMountedRef = useRef(true);
  const isSyncingRef = useRef(false);

  const debouncedUpdateBalance = useCallback(
    _.debounce(async (userRef, newBalance) => {
      if (!isMountedRef.current || isSyncingRef.current) return;
      try {
        isSyncingRef.current = true;
        await updateDoc(userRef, {
          coinBalance: newBalance
        });
      } catch (error) {
        console.error('Balance update failed:', error);
      } finally {
        isSyncingRef.current = false;
        if (isMountedRef.current) {
          setIsUpdating(false);
        }
      }
    }, 500), // Increased debounce to 500ms for better performance
    []
  );

  const updateBalance = useCallback((newBalance, userRef) => {
    if (!isMountedRef.current || lastBalanceRef.current === newBalance) return;
    
    setIsUpdating(true);
    lastBalanceRef.current = newBalance;
    setBalance(newBalance);
    
    if (userRef) {
      debouncedUpdateBalance(userRef, newBalance);
    } else {
      setIsUpdating(false);
    }
  }, [debouncedUpdateBalance]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadFirestoreData();
    } else {
      updateBalance(0);
      setTransactions([]);
      setHasMcVerified(false);
      setMcCredentials({ username: "", password: "" });
      setLinkedPlayer(null);
      lastBalanceRef.current = null;
    }
  }, [isLoggedIn, user, updateBalance]);

  useEffect(() => {
    if (!isLoggedIn || !user || !mcCredentials.username) return;
    
    const playerRef = doc(db, "players", mcCredentials.username);
    const userRef = doc(db, "users", user.email);
    let isSubscribed = true;
  
    // NEW: Real-time listener for player data changes
    const playerUnsubscribe = onSnapshot(playerRef,
      async (doc) => {
        if (!isSubscribed || !isMountedRef.current) return;
        
        if (doc.exists()) {
          const playerData = doc.data();
  
          // NEW: Update linked player state with optimized comparison
          setLinkedPlayer(prev => {
            if (_.isEqual(prev, playerData)) return prev;
            return {
              ...prev,
              kills: playerData.kills,
              deaths: playerData.deaths,
              kdRatio: playerData.kdRatio,
              leaderboardPosition: playerData.leaderboardPosition,
              imgUrl: playerData.imgUrl,
              coinBalance: playerData.coinBalance,
              ip: playerData.ip,
              UUID: playerData.UUID,
            };
          });
  
          // NEW: Update balance if changed and not currently syncing
//          if (playerData.coinBalance !== undefined && !isSyncingRef.current) {
//            console.log("Updating balance from player data:", playerData.coinBalance);
//            updateBalance(playerData.coinBalance, userRef);
//          }
        }
      },
      error => {
        console.error("Player sync error:", error);
        if (isMountedRef.current) {
          setIsUpdating(false);
        }
      }
    );
  
    // Cleanup function
    return () => {
      isSubscribed = false;
      playerUnsubscribe();
      debouncedUpdateBalance.cancel();
    };
  }, [isLoggedIn, user, mcCredentials.username, debouncedUpdateBalance, updateBalance]);
  
  const loadFirestoreData = async () => {
    try {
      console.log("Fetching user data for:", user.email);
      const userRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data loaded", userData);
        
        // NEW: Set initial balance from user data
        const initialBalance = userData.coinBalance || 0;
        console.log("Setting initial balance:", initialBalance);
        setBalance(initialBalance);
        
        setTransactions(userData.transactions || []);
        setHasMcVerified(userData.hasMcVerified || false);
        setMcCredentials({
          username: userData.mcUsername || "",
          password: userData.mcPassword || "",
        });
  
        // NEW: Check and sync with player data if verified
        if (userData.hasMcVerified && userData.mcUsername) {
          const playerRef = doc(db, "players", userData.mcUsername);
          const playerDoc = await getDoc(playerRef);
          
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            
            setLinkedPlayer({
              id: playerDoc.id,
              coinBalance: playerData.coinBalance,
              ...playerData
            });
  
            // NEW: If player balance differs, update both states
//            if (playerData.coinBalance !== initialBalance) {
//              console.log("Syncing balance with player data:", playerData.coinBalance);
//              setBalance(playerData.coinBalance);
//              await updateDoc(userRef, { coinBalance: playerData.coinBalance });
//            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading Firestore data:", error);
    }
  };

  const recordPurchaseTransaction = async (amount, productDetails) => {
    try {
      const transaction = {
        type: "purchase",
        amount: amount,
        timestamp: new Date().toISOString(),
        productId: productDetails.productId || productDetails.vendorProductId,
        description: `Purchased ${productDetails.name || 'Unknown Bundle'}`,
        id: Date.now().toString(),
      };
  
      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        transactions: arrayUnion(transaction)
      });
  
      setTransactions(prev => [...prev, transaction]);
      console.log("Purchase transaction recorded successfully");
      
      // Track purchase transaction event
      try {
        await trackEvent("purchase_transaction_recorded", {
          user_id: user.email,
          amount: amount,
          product_id: productDetails.productId || productDetails.vendorProductId,
          product_name: productDetails.name || 'Unknown Bundle',
          transaction_id: transaction.id,
          timestamp: transaction.timestamp
        });
      } catch (error) {
        console.error("Failed to track purchase transaction event:", error);
      }
    } catch (error) {
      console.error("Error recording purchase transaction:", error);
      throw error;
    }
  };
    
  const syncPlayerData = async (username, updates) => {
    try {
      const playerRef = doc(db, "players", username);
      await updateDoc(playerRef, updates);
      
      const playerDoc = await getDoc(playerRef);
      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        setLinkedPlayer({
          id: playerDoc.id,
          ...playerData
        });
      }
    } catch (error) {
      console.error("Error syncing player data:", error);
      throw error;
    }
  };

  const updateMcCredentials = async (username, password, playerBalance = 0) => {
    try {
      console.log("Updating MC credentials for:", user.email);

      const userRef = doc(db, "users", user.email);
      const playerRef = doc(db, "players", username);

      // Fetch player doc
      const playerDoc = await getDoc(playerRef);
      if (!playerDoc.exists()) {
        throw new Error("Player not found");
      }

      const playerData = playerDoc.data();
      const updateUserData = {
        mcUsername: username,
        mcPassword: password,
        hasMcVerified: true,
        coinBalance: playerBalance
      };

      // Only add uuid if it exists
      if (playerData.uuid) {
        updateUserData.uuid = playerData.uuid;
      }

      // Update user doc
      await updateDoc(userRef, updateUserData);

      // Update player doc
      await updateDoc(playerRef, {
        password: password
      });

      // Update local state
      setMcCredentials({ username, password });
      setHasMcVerified(true);
      setBalance(playerBalance);
      await loadFirestoreData();

      const updatedPlayerDoc = await getDoc(playerRef);
      const updatedPlayerData = updatedPlayerDoc.data();

      setLinkedPlayer({
        id: updatedPlayerDoc.id,
        ...updatedPlayerData
      });

      // Update Nova user profile
      try {
        await updateUserProfile({
          hasMcVerified: true,
          mcUsername: username
        });
      } catch (error) {
        console.error("Nova updateUserProfile failed:", error);
      }

      // Track MC verification event
      try {
        await trackEvent("mc_verification_completed", {
          user_id: user.email,
          mc_username: username,
          has_uuid: !!playerData.uuid,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Failed to track MC verification event:", error);
      }

      return true;
    } catch (error) {
      console.error("Error updating MC credentials:", error);
      
      // Track MC verification error event
      try {
        await trackEvent("mc_verification_error", {
          user_id: user.email,
          mc_username: username,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (trackError) {
        console.error("Failed to track MC verification error event:", trackError);
      }
      
      return false;
    }
  };

    const generateGiftCard = useCallback(async (amount) => {
      try {
        if (!user?.email) throw new Error("User not authenticated");
        if (amount > balance) throw new Error("Insufficient balance");
    console.log(amount);
        const tax = Math.round(amount * 0.05);
        console.log("Tax "+tax);
        const netAmount = Math.round(amount - tax);
        console.log(netAmount);
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log(code);
        const { Timestamp } = require('firebase/firestore');
    const tyronUserRef = doc(db, "users", "tyrongamess@gmail.com");

    await updateDoc(tyronUserRef, {

      transactions: arrayUnion({
        type: "tax_collected_gc",
        amount: tax,
        fromUser: user.email,
        timestamp: new Date().toISOString()
      })
    });

        await Promise.all([
          setDoc(doc(db, "giftCards", code), {
            code,
            originalAmount: Number(amount),
            netAmount: netAmount,
            tax: tax,
            createdBy: user.email,
            createdAt: Timestamp.now(),
            isClaimed: false
          }),

        ]);
        
        // Track gift card generation event
        try {
          await trackEvent("gift_card_generated", {
            user_id: user.email,
            original_amount: amount,
            net_amount: netAmount,
            tax_amount: tax,
            gift_card_code: code,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to track gift card generation event:", error);
        }
        
    setTimeout(async () => {
          // Get the gift card document and check if it's still unclaimed
          const giftCardRef = doc(db, "giftCards", code);
          const giftCardDoc = await getDoc(giftCardRef);

          if (giftCardDoc.exists() && !giftCardDoc.data().isClaimed) {
            // Auto-claim the gift card after 3 hours
            await updateDoc(giftCardRef, {
              isClaimed: true,
              claimedBy: user.email,
              claimedAt: new Date().toISOString()  // Log the auto claim time
            });

            // Fetch the netAmount from the gift card document
            const netAmountFromCard = giftCardDoc.data().netAmount;

            // Add the netAmount from the gift card to the user's balance
            const userRef = doc(db, "users", user.email);
            await updateDoc(userRef, {
              coinBalance: increment(netAmountFromCard)  // Add the netAmount to the user's balance
            });

            console.log(`Gift card ${code} auto claimed by ${user.email} and amount ${netAmountFromCard} added to their balance.`);
            
            // Track auto-claim event
            try {
              await trackEvent("gift_card_auto_claimed", {
                user_id: user.email,
                gift_card_code: code,
                claimed_amount: netAmountFromCard,
                claim_type: "auto_claim",
                time_to_claim: "3_hours",
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error("Failed to track gift card auto-claim event:", error);
            }
          }
        }, 3 * 60 * 60 * 1000);  // 3 hours in milliseconds

        return { code, netAmount };
      } catch (error) {
        console.error("Gift card generation failed:", error);
        
        // Track gift card generation error event
        try {
          await trackEvent("gift_card_generation_error", {
            user_id: user.email,
            amount: amount,
            error_message: error.message,
            timestamp: new Date().toISOString()
          });
        } catch (trackError) {
          console.error("Failed to track gift card generation error event:", trackError);
        }
        
        throw error;
      }
    }, [user, balance, subtractBalance]);

const claimGiftCode = useCallback(async (code) => {
  try {
    if (!user?.email) throw new Error("User not authenticated");

    const formattedCode = code.trim().toUpperCase();
    const giftCardRef = doc(db, "giftCards", formattedCode);
    const giftCardDoc = await getDoc(giftCardRef);

    if (!giftCardDoc.exists()) throw new Error("Gift code not found");

    const giftCardData = giftCardDoc.data();
    if (giftCardData.isClaimed) throw new Error("Gift code already claimed");

    const { Timestamp } = require("firebase/firestore");

    await Promise.all([
      updateDoc(giftCardRef, {
        isClaimed: true,
        claimedBy: user.email,
        claimedAt: Timestamp.now()
      }),
    ]);

    // Track gift card claim event
    try {
      await trackEvent("gift_card_claimed", {
        user_id: user.email,
        gift_card_code: formattedCode,
        claimed_amount: giftCardData.netAmount,
        original_amount: giftCardData.originalAmount,
        tax_amount: giftCardData.tax,
        claim_type: "manual_claim",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to track gift card claim event:", error);
    }

    return { success: true, amount: giftCardData.netAmount };
  } catch (error) {
    console.error("Gift code claim failed:", error);
    
    // Track gift card claim error event
    try {
      await trackEvent("gift_card_claim_error", {
        user_id: user.email,
        gift_card_code: code,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (trackError) {
      console.error("Failed to track gift card claim error event:", trackError);
    }
    
    return { success: false, message: error.message };
  }
}, [user, addBalance]);

  const updateMcVerificationStatus = async (status) => {
    try {
      console.log("Updating MC verification status:", status);
      const userRef = doc(db, "users", user.email);
      await updateDoc(userRef, {
        hasMcVerified: status,
      });
      setHasMcVerified(status);
      return true;
    } catch (error) {
      console.error("Error updating MC verification status:", error);
      return false;
    }
  };

  const hasSufficientBalance = useCallback(
    (amount) => {
      const sufficient = balance >= amount;
      console.log("Balance check:", { required: amount, current: balance, sufficient });
      return sufficient;
    },
    [balance]
  );

  const processPurchase = useCallback(
    async (amount, itemDetails) => {
      console.log("Processing purchase:", { amount, itemDetails });
      if (!hasMcVerified) {
        throw new Error("Minecraft verification required");
      }
      if (!hasSufficientBalance(amount)) {
        throw new Error("Insufficient balance");
      }

      try {
        const newBalance = balance - amount;
        const newTransaction = {
          type: "purchase",
          amount: -amount,
          details: itemDetails,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        const userRef = doc(db, "users", user.email);
        await Promise.all([
          updateDoc(userRef, {
            coinBalance: newBalance,
            transactions: arrayUnion(newTransaction),
          }),
          syncPlayerData(mcCredentials.username, {
            coinBalance: newBalance
          })
        ]);

        setBalance(newBalance);
        setTransactions((prev) => [...prev, newTransaction]);
        
        // Track purchase event
        try {
          await trackEvent("game_purchase_completed", {
            user_id: user.email,
            amount: amount,
            new_balance: newBalance,
            item_details: itemDetails,
            transaction_id: newTransaction.id,
            mc_username: mcCredentials.username,
            timestamp: newTransaction.timestamp
          });
        } catch (error) {
          console.error("Failed to track purchase event:", error);
        }
        
        return true;
      } catch (error) {
        console.error("Purchase failed:", error);
        
        // Track purchase error event
        try {
          await trackEvent("game_purchase_error", {
            user_id: user.email,
            amount: amount,
            item_details: itemDetails,
            error_message: error.message,
            timestamp: new Date().toISOString()
          });
        } catch (trackError) {
          console.error("Failed to track purchase error event:", trackError);
        }
        
        throw error;
      }
    },
    [balance, hasSufficientBalance, hasMcVerified, user, mcCredentials]
  );

  const refreshBalance = useCallback(async () => {
    try {
      const userRef = doc(db, "users", user.email);
      const userSnap = await getDoc(userRef);
      const latestBalance = userSnap.data()?.coinBalance || 0;
      setBalance(latestBalance);
      console.log(`Balance refreshed: ${latestBalance} coins for user ${user.email}`);
    } catch (error) {
      console.error("Failed to refresh balance:", error);
    }
  }, [user]);
const subtractBalance = useCallback(async (amount) => {
  if (amount <= 0) return;

  try {
    const userRef = doc(db, "users", user.email);
    const userSnap = await getDoc(userRef);
    const currentBalance = userSnap.data()?.coinBalance || 0;
    const newBalance = currentBalance - amount;

    const tyronUserRef = doc(db, "users", "tyrongamess@gmail.com");
    const { Timestamp } = require('firebase/firestore');

    await updateDoc(tyronUserRef, {
      transactions: arrayUnion({
        type: "tax_collected",
        amount: amount,
        fromUser: user.email,
        timestamp: new Date().toISOString()
      })
    });

    await Promise.all([
      updateDoc(userRef, {
        coinBalance: newBalance,
        transactions: arrayUnion({
          type: "app events",
          amount: amount,
          fromUser: user.email,
          timestamp: Timestamp.now()
        })
      }),
      mcCredentials.username && syncPlayerData(mcCredentials.username, {
        coinBalance: newBalance
      })
    ]);

    setBalance(newBalance);

    // Update Nova user profile
    try {
      await updateUserProfile({
        coinBalance: newBalance,
        lastTransaction: new Date().toISOString()
      });
    } catch (error) {
      console.error("Nova updateUserProfile failed:", error);
    }

    // Track balance subtraction event
    try {
      await trackEvent("balance_subtracted", {
        user_id: user.email,
        amount: amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        reason: "app_events",
        mc_username: mcCredentials.username,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to track balance subtraction event:", error);
    }

    console.log(`Subtracted ${amount} coins of user ${user.email}`);
    await refreshBalance();
    return true;
  } catch (error) {
    console.error("Failed to subtract coins:", error);
    
    // Track balance subtraction error event
    try {
      await trackEvent("balance_subtraction_error", {
        user_id: user.email,
        amount: amount,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (trackError) {
      console.error("Failed to track balance subtraction error event:", trackError);
    }
    
    return false;
  }
}, [user, mcCredentials]);

const addBalance = useCallback(async (amount) => {
  if (amount <= 0) return;

  try {
   const userRef = doc(db, "users", user.email);
       const userSnap = await getDoc(userRef);
       const currentBalance = userSnap.data()?.coinBalance || 0;
       const newBalance = currentBalance + amount;

    await Promise.all([
      updateDoc(userRef, { coinBalance: newBalance }),
      mcCredentials.username && syncPlayerData(mcCredentials.username, {
        coinBalance: newBalance
      })
    ]);

    setBalance(newBalance);
    
    // Update Nova user profile
    try {
      await updateUserProfile({
        coinBalance: newBalance,
        lastTransaction: new Date().toISOString()
      });
    } catch (error) {
      console.error("Nova updateUserProfile failed:", error);
    }
    
    // Track balance addition event
    try {
      await trackEvent("balance_added", {
        user_id: user.email,
        amount: amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        mc_username: mcCredentials.username,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to track balance addition event:", error);
    }
    
    console.log(`Added ${amount} coins coins of user ${user.email}`);
    await refreshBalance();
    return true;
  } catch (error) {
    console.error("Failed to add coins:", error);
    
    // Track balance addition error event
    try {
      await trackEvent("balance_addition_error", {
        user_id: user.email,
        amount: amount,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
    } catch (trackError) {
      console.error("Failed to track balance addition error event:", trackError);
    }
    
    return false;
  }
}, [balance, user, mcCredentials]);

const addCoins = useCallback(
  async (amount, productDetails = null) => {
    try {
      const newBalance = balance + amount;
      const transaction = {
        type: "credit",
        amount: amount,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...(productDetails && {
          productId: productDetails.productId || productDetails.vendorProductId,
          description: `Purchased ${productDetails.name || 'Coin Bundle'}`
        })
      };

      const userRef = doc(db, "users", user.email);
      await Promise.all([
        updateDoc(userRef, {
          coinBalance: newBalance,
          transactions: arrayUnion(transaction),
        }),
        mcCredentials.username && syncPlayerData(mcCredentials.username, {
          coinBalance: newBalance
        })
      ]);

      setBalance(newBalance);
      setTransactions((prev) => [...prev, transaction]);
      
      // Update Nova user profile
      try {
        await updateUserProfile({
          coinBalance: newBalance,
          lastTransaction: new Date().toISOString()
        });
      } catch (error) {
        console.error("Nova updateUserProfile failed:", error);
      }
      
      // Track coin bundle purchase event
      try {
        await trackEvent("coin_bundle_purchased", {
          user_id: user.email,
          amount: amount,
          new_balance: newBalance,
          product_details: productDetails,
          transaction_id: transaction.id,
          mc_username: mcCredentials.username,
          timestamp: transaction.timestamp
        });
      } catch (error) {
        console.error("Failed to track coin bundle purchase event:", error);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to add coins:", error);
      
      // Track coin bundle purchase error event
      try {
        await trackEvent("coin_bundle_purchase_error", {
          user_id: user.email,
          amount: amount,
          product_details: productDetails,
          error_message: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (trackError) {
        console.error("Failed to track coin bundle purchase error event:", trackError);
      }
      
      throw error;
    }
  },
  [balance, user, mcCredentials]
);  
  
  return (
    <UserContext.Provider
      value={{
        balance,
        transactions,
        hasSufficientBalance,
        processPurchase,
        addCoins,
        subtractBalance,   // ✅ NEW
        addBalance,
        generateGiftCard,
        claimGiftCode,
        hasMcVerified,
        updateMcVerificationStatus,
        updateMcCredentials,
        mcCredentials,
        linkedPlayer,
        loadFirestoreData,
        isUpdating,  // NEW: Expose loading state
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;