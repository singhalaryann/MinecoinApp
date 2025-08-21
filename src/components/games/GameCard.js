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
import { colors } from '../../screens/theme'; // Import your theme colors

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameCard = ({ game, style, showSection = true }) => {
  const navigation = useNavigation();
  const { hasSufficientBalance, processPurchase, hasMcVerified } = useUser();
  const { isLoggedIn, user } = useAuth();
  const [showBuyButton, setShowBuyButton] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

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
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation for new items
    if (game.isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
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
        gradient: [colors.accentDark, colors.accent],
        shadowColor: colors.accent,
        borderColor: colors.accentGlow,
        bgColor: 'rgba(236, 241, 243, 0.15)',
        icon: '🌲',
        name: 'SURVIVAL',
      },
      lifesteal: {
        gradient: ['#EF4444', '#DC2626'],
        shadowColor: '#EF4444',
        borderColor: 'rgba(239, 68, 68, 0.6)',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        icon: '⚔️',
        name: 'LIFESTEAL',
      },
      creative: {
        gradient: [colors.primaryLight, colors.primaryDark],
        shadowColor: colors.primary,
        borderColor: colors.border,
        bgColor: colors.primaryFaded,
        icon: '🎨',
        name: 'CREATIVE',
      },
      pvp: {
        gradient: ['#F59E0B', '#D97706'],
        shadowColor: '#F59E0B',
        borderColor: 'rgba(245, 158, 11, 0.6)',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        icon: '⚡',
        name: 'PVP',
      },
      skyblock: {
        gradient: ['#8B5CF6', '#7C3AED'],
        shadowColor: '#8B5CF6',
        borderColor: 'rgba(139, 92, 246, 0.6)',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        icon: '☁️',
        name: 'SKYBLOCK',
      },
      prison: {
        gradient: [colors.mutedText, '#4B5563'],
        shadowColor: colors.mutedText,
        borderColor: 'rgba(107, 114, 128, 0.6)',
        bgColor: 'rgba(107, 114, 128, 0.15)',
        icon: '🔒',
        name: 'PRISON',
      },
      default: {
        gradient: [colors.accentDark, colors.accent],
        shadowColor: colors.accent,
        borderColor: colors.accentGlow,
        bgColor: 'rgba(0, 212, 255, 0.15)',
        icon: '🎮',
        name: 'GAME',
      },
    };
    return configs[section?.toLowerCase()] || configs.default;
  };

  const handleCardPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
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
  const imageWidth = cardWidth * 0.32;
  const sectionConfig = getSectionConfig(game.section);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }], // Remove pulseAnim to fix moving
          shadowColor: sectionConfig.shadowColor,
        },
        style,
      ]}
    >
      {/* Gaming Glow Effect */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            opacity: glowOpacity,
            shadowColor: sectionConfig.shadowColor,
          },
        ]}
      />

      {/* Main Card Container */}
      <LinearGradient
        colors={[colors.backgroundLight, colors.background]}
        style={[
          styles.container,
          {
            borderColor: sectionConfig.borderColor,
            shadowColor: sectionConfig.shadowColor,
          },
        ]}
      >
        {/* Left Section - Gaming Image (Original Size) */}
        <View style={[styles.leftSection, { width: imageWidth }]}>
          <View style={styles.imageContainer}>
            {/* Image Glow Ring */}
            <LinearGradient
              colors={[sectionConfig.gradient[0] + '40', 'transparent', sectionConfig.gradient[1] + '40']}
              style={styles.imageGlowRing}
            />

            <Image
              source={game.imageUrl ? { uri: game.imageUrl } : require('../../../assets/bat.png')}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Gaming Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
              style={styles.imageOverlay}
            />
          </View>

          {/* Gaming Tags */}
          <View style={styles.tagsContainer}>
            {/* Section Tag */}
            {showSection && game.section && (
              <LinearGradient
                colors={sectionConfig.gradient}
                style={[
                  styles.sectionTag,
                  {
                    shadowColor: sectionConfig.shadowColor,
                  },
                ]}
              >
                <Text style={styles.sectionIcon}>{sectionConfig.icon}</Text>
                <Text style={styles.sectionTagText}>{sectionConfig.name}</Text>
              </LinearGradient>
            )}

            {/* Discount Tag */}
            {game.discount > 0 && (
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={[styles.tag, styles.discountTag]}
              >
                <Text style={styles.tagIcon}>🔥</Text>
                <Text style={styles.tagText}>-{game.discount}%</Text>
              </LinearGradient>
            )}

            {/* New Tag */}
            {game.isNew && (
              <LinearGradient
                colors={sectionConfig.gradient}
                style={[styles.tag, styles.newTag]}
              >
                <Text style={styles.tagIcon}>✨</Text>
                <Text style={styles.tagText}>NEW</Text>
              </LinearGradient>
            )}
          </View>
        </View>

        {/* Right Section - Gaming Content */}
        <View style={styles.rightSection}>
          {/* Gaming Header */}
          <View style={styles.gameHeader}>
            <View style={styles.titleSection}>
              <Text style={[styles.gameTitle, { color: colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
                {game.title}
              </Text>
              <View style={styles.passSection}>
                <LinearGradient
                  colors={[colors.accentGlow, 'rgba(0, 212, 255, 0.1)']}
                  style={styles.passBadge}
                >
                  <Text style={[styles.passIcon, { color: colors.accent }]}>🎮</Text>
                  <Text style={[styles.passText, { color: colors.accent }]}>PREMIUM PASS</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Gaming Description */}
          <Text style={[styles.gameDescription, { color: colors.lightText }]} numberOfLines={2} ellipsizeMode="tail">
            {game.achievementText || "Unlock exclusive gaming features and premium rewards"}
          </Text>

          {/* Gaming Stats */}
          <View style={styles.gameStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>PRICE</Text>
              <View style={styles.statValue}>
                <Text style={[styles.priceText, { color: colors.accent }]}>{game.price}</Text>
                <Image source={require('../../../assets/rupee.png')} style={styles.priceIcon} />
              </View>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.accentGlow }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>TYPE</Text>
              <Text style={[styles.statValueText, { color: colors.text }]}>ASSET</Text>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <LinearGradient
              colors={colors.dangerGradient}
              style={styles.errorContainer}
            >
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </LinearGradient>
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
                    <Text style={styles.buyNowText}>BUY NOW</Text>
                    <View style={styles.buyNowPrice}>
                      <Text style={styles.buyNowPriceText}>{game.price}</Text>
                      <Image source={require('../../../assets/rupee.png')} style={styles.buyNowIcon} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.purchaseSection}>
                {/* Quantity Selector */}
                <View style={styles.quantitySection}>
                  <Text style={[styles.quantityLabel, { color: colors.mutedText }]}>QUANTITY</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => setQuantity(q => Math.max(1, q - 1))}
                      activeOpacity={0.7}
                      disabled={purchasing}
                    >
                      <LinearGradient
                        colors={[colors.accentDark, colors.accent]}
                        style={styles.quantityButtonGradient}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </LinearGradient>
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
                      <LinearGradient
                        colors={[colors.accentDark, colors.accent]}
                        style={styles.quantityButtonGradient}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Purchase */}
                <View style={styles.confirmSection}>
                  <View style={styles.totalSection}>
                    <Text style={[styles.totalLabel, { color: colors.mutedText }]}>TOTAL</Text>
                    <Text style={[styles.totalValue, { color: colors.accent }]}>{game.price * quantity}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                    onPress={handleBuyPress}
                    disabled={purchasing}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={purchasing ? colors.dangerGradient : [colors.accentDark, colors.accent]}
                      style={styles.confirmButtonGradient}
                    >
                      {purchasing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.confirmButtonText}>CONFIRM</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 6,
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
  },

  // Left Section - Gaming Image (Original Size)
  leftSection: {
    position: 'relative',
    aspectRatio: 1,
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
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    zIndex: 1,
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
    top: 8,
    left: 8,
    gap: 6,
    zIndex: 3,
  },
  sectionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  sectionIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  sectionTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountTag: {
    shadowColor: '#EF4444',
  },
  newTag: {
    shadowColor: colors.accent,
  },
  tagIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Right Section - Gaming Content
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gameHeader: {
    marginBottom: 10,
  },
  titleSection: {
    gap: 8,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF', // Changed from colors.accent to pure white for better contrast
    letterSpacing: 0.8,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  passSection: {
    alignSelf: 'flex-start',
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentGlow,
  },
  passIcon: {
    fontSize: 10,
    marginRight: 4,
    color: colors.accent,
  },
  passText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 13,
    color: colors.lightText,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  gameStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedText,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  priceIcon: {
    width: 14,
    height: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.accentGlow,
    marginHorizontal: 12,
  },
  statValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },

  // Error Display
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
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
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buyNowPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  buyNowPriceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  buyNowIcon: {
    width: 12,
    height: 12,
  },

  // Purchase Section
  purchaseSection: {
    gap: 12,
  },
  quantitySection: {
    gap: 8,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mutedText,
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
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 16,
  },
  quantityDisplay: {
    minWidth: 32,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  confirmSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalSection: {
    alignItems: 'flex-start',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.mutedText,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 0.3,
  },
  confirmButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});

export default GameCard;