import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import InsufficientBalance from './InsufficientBalanceModal';
import { updateUserBalance, savePurchaseHistory } from '../../config/firebase';
import { useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameCard = ({ game, onPress, style, showSection = false, colors: propColors }) => {
  const navigation = useNavigation();
  const { hasSufficientBalance, processPurchase, hasMcVerified } = useUser();
  const { isLoggedIn, user } = useAuth();
  const [showBuyButton, setShowBuyButton] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Get live theme colors from Nova dashboard
  const themeColors = useThemeColors();
  // Use prop colors if passed, otherwise use theme colors
  const colors = propColors || themeColors;
  
  // Safety check - ensure colors are loaded before rendering
  if (!colors) {
    return null; // Don't render until colors are ready
  }

  // Gaming animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for new items
    if (game.isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, []);

  // Gaming section configurations with theme colors
  const getSectionConfig = (section) => {
    const configs = {
      survival: {
        gradient: [colors.accent, colors.success],
        borderColor: colors.accent,
        bgColor: colors.success + '15',
        icon: '🌲',
        name: 'SURVIVAL',
      },
      lifesteal: {
        gradient: [colors.error, colors.warning],
        borderColor: colors.error,
        bgColor: colors.error + '15',
        icon: '⚔️',
        name: 'LIFESTEAL',
      },
      creative: {
        gradient: [colors.primary, colors.accent],
        borderColor: colors.primary,
        bgColor: colors.primary + '15',
        icon: '🎨',
        name: 'CREATIVE',
      },
      pvp: {
        gradient: [colors.warning, colors.error],
        borderColor: colors.warning,
        bgColor: colors.warning + '15',
        icon: '⚡',
        name: 'PVP',
      },
      skyblock: {
        gradient: [colors.accent, colors.primary],
        borderColor: colors.accent,
        bgColor: colors.accent + '15',
        icon: '☁️',
        name: 'SKYBLOCK',
      },
      prison: {
        gradient: [colors.border, colors.text],
        borderColor: colors.border,
        bgColor: colors.border + '15',
        icon: '🔒',
        name: 'PRISON',
      },
      default: {
        gradient: [colors.accent, colors.primary],
        borderColor: colors.accent,
        bgColor: colors.accent + '15',
        icon: '🎮',
        name: 'GAME',
      },
    };
    return configs[section?.toLowerCase()] || configs.default;
  };

  const handleCardPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCoinPress = () => {
    setError(null);
    setShowBuyButton(true);
    handleCardPress();
  };

  const handleBuyPress = async () => {
    if (!isLoggedIn) {
      navigation.navigate('Profile');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }

    const totalPrice = game.price * quantity;
    if (!hasSufficientBalance(totalPrice)) {
      setShowInsufficientBalance(true);
      return;
    }

    if (!hasMcVerified) {
      navigation.navigate('Profile', {
        screen: 'MC Verification',
        params: { returnTo: 'GameAssets' },
      });
      return;
    }

    try {
      setPurchasing(true);
      setError(null);

      await updateUserBalance(user.email, totalPrice);

      for (let i = 0; i < quantity; i++) {
        await savePurchaseHistory(user.email, {
          gameId: game.id,
          title: game.title,
          price: game.price,
          section: game.section || 'general',
          purchaseDate: new Date(),
          gamegiven: false,
        });
      }

      await processPurchase(totalPrice, { title: game.title, quantity });
      navigation.navigate('PaymentSuccess', { game });
      setShowBuyButton(false);
      setQuantity(1);
    } catch (error) {
      console.error('Purchase failed:', error);
      if (error.message === 'Minecraft verification required') {
        navigation.navigate('Profile', {
          screen: 'MC Verification',
          params: { returnTo: 'GameAssets' },
        });
      } else {
        setError('Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const cardWidth = style?.width || SCREEN_WIDTH - 32;
  const imageWidth = cardWidth * 0.35;
  const imageHeight = cardWidth * 0.57; // Square aspect ratio for better fit
  const sectionConfig = getSectionConfig(game.section);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
        },
        style,
      ]}
    >
      {/* Main Card Container */}
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        {/* Left Section - Gaming Image */}
        <View style={[styles.leftSection, { width: imageWidth, height: imageHeight }]}>
          <View style={styles.imageContainer}>
            {/* Image Glow Ring */}
            <LinearGradient
              colors={[sectionConfig.gradient[0] + '30', 'transparent', sectionConfig.gradient[1] + '30']}
              style={styles.imageGlowRing}
            />

            <Image
              source={game.imageUrl ? { uri: game.imageUrl } : require('../../../assets/bat.png')}
              style={[styles.image, { backgroundColor: colors.card, width: imageWidth, height: imageHeight }]}
              resizeMode="cover"
            />

            {/* Gaming Overlay */}
            <LinearGradient
              colors={['transparent', `${colors.background}80`]}
              style={styles.imageOverlay}
            />
          </View>

          {/* Gaming Tags */}
          <View style={styles.tagsContainer}>
            {/* Section Tag */}
            {showSection && game.section && (
              <LinearGradient
                colors={sectionConfig.gradient}
                style={styles.sectionTag}
              >
                <Text style={styles.sectionIcon}>{sectionConfig.icon}</Text>
                <Text style={[styles.sectionTagText, { color: colors.white }]}>{sectionConfig.name}</Text>
              </LinearGradient>
            )}

            {/* Discount Tag */}
            {game.discount > 0 && (
              <View style={[styles.tag, styles.discountTag, { backgroundColor: colors.error }]}>
                <Text style={styles.tagIcon}>🔥</Text>
                <Text style={[styles.tagText, { color: colors.white }]}>-{game.discount}%</Text>
              </View>
            )}

            {/* New Tag */}
            {game.isNew && (
              <LinearGradient
                colors={sectionConfig.gradient}
                style={styles.tag}
              >
                <Text style={styles.tagIcon}>✨</Text>
                <Text style={[styles.tagText, { color: colors.white }]}>NEW</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Right Section - Gaming Content */}
        <View style={styles.rightSection}>
          {/* Gaming Header */}
          <View style={styles.gameHeader}>
            <Text style={[styles.gameTitle, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
              {game.title}
            </Text>
            <View style={styles.passSection}>
              <View style={[styles.passBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
                <Text style={[styles.passIcon, { color: colors.accent }]}>🎮</Text>
                <Text style={[styles.passText, { color: colors.accent }]}>PREMIUM</Text>
              </View>
            </View>
          </View>

          {/* Gaming Description */}
          <Text style={[styles.gameDescription, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
            {game.achievementText || "Unlock exclusive gaming features and premium rewards"}
          </Text>

          {/* Gaming Stats */}
          <View style={styles.gameStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text }]}>PRICE</Text>
              <View style={styles.statValue}>
                <Text style={[styles.priceText, { color: colors.accent }]}>{game.price}</Text>
                <Image source={require('../../../assets/rupee.png')} style={styles.priceIcon} />
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.text }]}>TYPE</Text>
              <Text style={[styles.statValueText, { color: colors.text }]}>ASSET</Text>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Gaming Action Section */}
          <View style={styles.actionSection}>
            {!showBuyButton ? (
              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={handleCoinPress}
                disabled={purchasing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={sectionConfig.gradient}
                  style={styles.buyNowGradient}
                >
                  <View style={styles.buyNowContent}>
                    <Text style={[styles.buyNowText, { color: colors.white }]}>BUY NOW</Text>
                    <View style={[styles.buyNowPrice, { backgroundColor: colors.white + '20' }]}>
                      <Text style={[styles.buyNowPriceText, { color: colors.white }]}>{game.price}</Text>
                      <Image source={require('../../../assets/rupee.png')} style={styles.buyNowIcon} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.purchaseSection}>
                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                  <Text style={[styles.quantityLabel, { color: colors.text }]}>QUANTITY</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(q => Math.max(1, q - 1))}
                      activeOpacity={0.7}
                      disabled={purchasing}
                    >
                      <View style={[styles.quantityButtonGradient, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.quantityButtonText, { color: colors.white }]}>−</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.quantityDisplay}>
                      <Text style={[styles.quantityText, { color: colors.accent }]}>{quantity}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(q => q + 1)}
                      activeOpacity={0.7}
                      disabled={purchasing}
                    >
                      <View style={[styles.quantityButtonGradient, { backgroundColor: colors.accent }]}>
                        <Text style={[styles.quantityButtonText, { color: colors.white }]}>+</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Purchase */}
                <View style={styles.confirmSection}>
                  <View style={styles.totalSection}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>TOTAL</Text>
                    <Text style={[styles.totalValue, { color: colors.accent }]}>{game.price * quantity}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                    onPress={handleBuyPress}
                    disabled={purchasing}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={purchasing ? [colors.error, colors.error] : sectionConfig.gradient}
                      style={styles.confirmButtonGradient}
                    >
                      {purchasing ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={[styles.confirmButtonText, { color: colors.white }]}>CONFIRM</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      <InsufficientBalance
        visible={showInsufficientBalance}
        onClose={() => {
          setShowInsufficientBalance(false);
          setShowBuyButton(false);
          setQuantity(1);
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 6,
    position: 'relative',
    alignSelf: 'stretch',
  },
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 120,
  },

  // Left Section - Gaming Image
  leftSection: {
    position: 'relative',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGlowRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    zIndex: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    zIndex: 1,
    alignSelf: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderRadius: 20,
    zIndex: 2,
  },
  tagsContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    gap: 5,
    zIndex: 3,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionIcon: {
    fontSize: 11,
    marginRight: 3,
  },
  sectionTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountTag: {
    // backgroundColor will be set dynamically
  },
  tagIcon: {
    fontSize: 9,
    marginRight: 2,
  },
  tagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Right Section - Gaming Content
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 2,
  },
  gameHeader: {
    marginBottom: 14,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 22,
    marginBottom: 10,
  },
  passSection: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  passIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  passText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  gameStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.7,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  priceIcon: {
    width: 12,
    height: 12,
  },
  statDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 14,
    opacity: 0.3,
  },
  statValueText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Error Display
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  // Action Section
  actionSection: {
    marginTop: 8,
  },
  buyNowButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyNowGradient: {
    borderRadius: 16,
  },
  buyNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  buyNowText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  buyNowPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buyNowPriceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  buyNowIcon: {
    width: 10,
    height: 10,
  },

  // Purchase Section
  purchaseSection: {
    gap: 12,
  },
  quantitySection: {
    gap: 6,
  },
  quantityLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  quantityButtonGradient: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 14,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  confirmSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  totalSection: {
    alignItems: 'flex-start',
    marginRight: 6,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
    opacity: 0.7,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  confirmButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default GameCard;