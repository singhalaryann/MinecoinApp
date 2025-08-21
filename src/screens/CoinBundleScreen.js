import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { adapty } from 'react-native-adapty';
import { createPaywallView } from '@adapty/react-native-ui';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { colors } from './theme';
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const PLACEMENT_ID = '2233';

const Toast = ({ message, visible, onHide, onComplete }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);

      const timer = setTimeout(() => {
        translateY.value = withTiming(-100);
        opacity.value = withTiming(0);
        onHide();
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const CoinBundleScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn } = useAuth();
  const { hasMcVerified, addCoins, isUpdating } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coinBundles, setCoinBundles] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [transactionCompleted, setTransactionCompleted] = useState(false);

  useEffect(() => {
    if (!isUpdating && error) {
      setError(null);
    }
  }, [isUpdating]);

  useEffect(() => {
    const fetchCoinBundles = async () => {
      try {
        setLoading(true);
        const bundlesRef = collection(db, 'coinBundles');
        const snapshot = await getDocs(bundlesRef);
        const bundles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCoinBundles(bundles);
      } catch (err) {
        console.error('Error fetching coin bundles:', err);
        setError('Failed to load coin bundle information');
      } finally {
        setLoading(false);
      }
    };

    fetchCoinBundles();
  }, []);

  const handlePurchaseSuccess = async coinBundle => {
    try {
      await addCoins(coinBundle.coinAmount, coinBundle);
      setTransactionCompleted(true);
      setToastMessage(`${coinBundle.coinAmount} coins have been added to your account!`);
      setToastVisible(true);
    } catch (err) {
      console.error('Error adding coins:', err);
      setError('Failed to add coins to your account. Please contact support.');
    }
  };

  const handlePurchase = async () => {
    if (isUpdating) {
      setError('Please wait for current transaction to complete.');
      return;
    }

    if (transactionCompleted) {
      setError('Please return to main screen before making another purchase.');
      return;
    }

    if (!hasMcVerified) {
      setError('Minecraft verification required to proceed.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const paywall = await adapty.getPaywall(PLACEMENT_ID, 'en');

      if (paywall.hasViewConfiguration) {
        const view = await createPaywallView(paywall);

        view.registerEventHandlers({
          onClose: () => setSelectedProductId(null),
          onProductSelected: product => setSelectedProductId(product.vendorProductId),
          onPurchaseCompleted: async purchaseResult => {
            try {
              const nonSubscriptions = purchaseResult?.nonSubscriptions;
              if (!nonSubscriptions || Object.keys(nonSubscriptions).length === 0) {
                throw new Error('No non-subscription purchases found.');
              }

              let latestPurchase = null;
              for (const purchases of Object.values(nonSubscriptions)) {
                purchases.forEach(purchase => {
                  const purchaseTime = new Date(purchase.purchasedAt).getTime();
                  if (!latestPurchase || purchaseTime > new Date(latestPurchase.purchasedAt).getTime()) {
                    latestPurchase = purchase;
                  }
                });
              }

              if (!latestPurchase) throw new Error('No valid purchases found.');

              const productId = latestPurchase.vendorProductId;
              const bundlesRef = collection(db, 'coinBundles');
              const snapshot = await getDocs(bundlesRef);

              if (snapshot.empty) throw new Error('No coin bundles found.');

              const bundles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));

              const coinBundle = bundles.find(bundle => bundle.productId === productId);
              if (!coinBundle) throw new Error('Product not found in bundles');

              await handlePurchaseSuccess(coinBundle);
            } catch (err) {
              console.error('Error processing purchase:', err);
              setError('Failed to credit coins. Please try again.');
            }
          },
          onPurchaseCancelled: () => setSelectedProductId(null),
          onPurchaseError: () => {
            setError('Purchase could not be completed. Please try again.');
            setSelectedProductId(null);
          },
        });

        await view.present();
      } else {
        setError('No coin bundles available at the moment.');
      }
    } catch (err) {
      setError('Failed to load coin bundles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || isUpdating || transactionCompleted;

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        onComplete={() => navigation.navigate('Main')}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Get Coins</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <Text style={styles.subtitle}>Select a coin bundle to purchase</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
          ) : (
            <TouchableOpacity
              style={[styles.bundleButton, isButtonDisabled && styles.disabledButton]}
              onPress={handlePurchase}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.bundleButtonText}>
                  {transactionCompleted ? 'Purchase Complete' : 'View Coin Bundles'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>• Purchases will be added to your account immediately</Text>
            <Text style={styles.infoText}>• All purchases are final and non-refundable</Text>
            <Text style={styles.infoText}>• For any issues, please contact support</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed to transparent to show gradient
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 1,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    padding: 24,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.accent, // Changed to theme color
    marginBottom: 28,
    textAlign: 'center',
  },
  bundleButton: {
    backgroundColor: colors.accent, // Changed to theme color
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginBottom: 36,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  bundleButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a0a0a',
  },
  loader: {
    marginVertical: 24,
  },
  infoContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    padding: 24,
    borderRadius: 14,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  infoText: {
    fontSize: 15,
    color: colors.mutedText, // Changed to theme color
    marginBottom: 16,
    lineHeight: 22,
  },
  errorText: {
    color: colors.error, // Changed to theme error color
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: '5%',
    right: '5%',
    backgroundColor: colors.accent, // Changed to theme color
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 1000,
  },
  toastText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default CoinBundleScreen;