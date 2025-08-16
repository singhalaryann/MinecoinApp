import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  TouchableOpacity,
  Linking,
  View,
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import NotificationBanner from '../components/common/NotificationBanner';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useThemeColors, colors as staticColors } from './theme'; // ← IMPORTANT: Import both!

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// ==================== COMPONENTS ====================

// Simple Hero Section
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, filteredCount, colors }) => {
  return (
    <View style={[styles.heroContainer]}>
      <Text style={[styles.heroTitle, { color: colors.accent, textShadowColor: colors.accentGlow }]}>
        GAME ASSETS
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.lightText }]}>
        {selectedSection === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${selectedSection} assets`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.accent }]} />
    </View>
  );
});

// Clean Filter Bar
const CleanGamingFilter = React.memo(({ sections, selectedSection, onSectionChange, colors }) => {
  const sectionConfigs = {
    survival: { emoji: '🌲', name: 'Survival' },
    lifesteal: { emoji: '⚔️', name: 'Lifesteal' },
    creative: { emoji: '🎨', name: 'Creative' },
    pvp: { emoji: '⚡', name: 'PvP' },
    skyblock: { emoji: '☁️', name: 'Skyblock' },
    prison: { emoji: '🔒', name: 'Prison' },
  };

  return (
    <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colors.card, borderColor: colors.border },
            selectedSection === 'all' && [styles.filterButtonActive, { 
              backgroundColor: colors.accent, 
              borderColor: colors.accent,
              shadowColor: colors.accentGlow 
            }],
          ]}
          onPress={() => onSectionChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText, 
            { color: colors.lightText },
            selectedSection === 'all' && [styles.filterButtonTextActive, { color: colors.text }]
          ]}>
            🎮 All Games
          </Text>
        </TouchableOpacity>
        {sections.map((section) => {
          const config = sectionConfigs[section.toLowerCase()] || {
            emoji: '🎮',
            name: section,
          };
          const isActive = selectedSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && [styles.filterButtonActive, { 
                  backgroundColor: colors.accent, 
                  borderColor: colors.accent,
                  shadowColor: colors.accentGlow 
                }],
              ]}
              onPress={() => onSectionChange(section)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { color: colors.lightText },
                isActive && [styles.filterButtonTextActive, { color: colors.text }]
              ]}>
                {config.emoji} {config.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// Animated Game Card
const AnimatedGameCard = React.memo(({ game, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 16,
        width: CARD_WIDTH,
        alignSelf: 'center',
      }}
    >
      <GameCard
        game={game}
        style={styles.gameCard}
        showSection={true}
      />
    </Animated.View>
  );
});

// Section Header
const SimpleSectionHeader = React.memo(({ title, count, colors }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.sectionCount, { color: colors.mutedText }]}>
        {count} Assets
      </Text>
    </View>
  );
});

// Loading State
const SimpleLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={[styles.loadingText, { color: colors.lightText }]}>
      Loading Assets...
    </Text>
  </View>
));

// Error State
const SimpleErrorState = React.memo(({ error, onRetry, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.errorText, { color: colors.error }]}>
      Error: {error}
    </Text>
    <TouchableOpacity 
      style={[styles.retryButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]} 
      onPress={onRetry}
    >
      <Text style={[styles.retryButtonText, { color: colors.text }]}>
        Retry
      </Text>
    </TouchableOpacity>
  </View>
));

// Empty State
const SimpleEmptyState = React.memo(({ selectedSection, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.emptyText, { color: colors.mutedText }]}>
      No {selectedSection !== 'all' ? selectedSection : ''} assets found.
    </Text>
  </View>
));

// ==================== MAIN COMPONENT ====================

const MainScreen = () => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors; // Use Nova colors or fallback to static
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const { balance } = useUser();

  const loadGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const assets = await fetchGameAssets();
      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
      }));
      if (normalizedAssets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(normalizedAssets);
        const uniqueSections = [
          ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
        ].sort();
        setSections(uniqueSections);
      }
    } catch (err) {
      console.error('Error loading game assets:', err);
      setError('Failed to load game assets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGameAssets();
  }, [loadGameAssets]);

  const filteredGames = useMemo(() => {
    return selectedSection === 'all'
      ? gameAssets
      : gameAssets.filter((g) => g.section === selectedSection);
  }, [gameAssets, selectedSection]);

  const groupedGames = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section] = gameAssets.filter((g) => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections]);

  const renderGameContent = () => {
    if (filteredGames.length === 0) {
      return <SimpleEmptyState selectedSection={selectedSection} colors={colors} />;
    }
    if (selectedSection === 'all') {
      return sections.map((section) => {
        const sectionGames = groupedGames[section];
        if (sectionGames.length === 0) return null;
        return (
          <View key={section} style={styles.sectionGroup}>
            <SimpleSectionHeader
              title={section.charAt(0).toUpperCase() + section.slice(1)}
              count={sectionGames.length}
              colors={colors}
            />
            <View style={styles.gamesList}>
              {sectionGames.map((game, index) => (
                <AnimatedGameCard
                  key={game.id}
                  game={game}
                  index={index}
                />
              ))}
            </View>
          </View>
        );
      });
    } else {
      return (
        <View style={styles.gamesList}>
          {filteredGames.map((game, index) => (
            <AnimatedGameCard
              key={game.id}
              game={game}
              index={index}
            />
          ))}
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleLoadingState colors={colors} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleErrorState error={error} onRetry={loadGameAssets} colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />

      <Header balance={balance} />
      <NotificationBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <SimpleGamingHero
          gameCount={gameAssets.length}
          selectedSection={selectedSection}
          filteredCount={filteredGames.length}
          colors={colors}
        />

        <CleanGamingFilter
          sections={sections}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          colors={colors}
        />

        {renderGameContent()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Support FAB */}
      <TouchableOpacity
        style={[styles.fab, { shadowColor: colors.fabShadow }]}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://t.me/xgamingclub')}
      >
        <LinearGradient colors={colors.activeGradient} style={styles.fabGradient}>
          <Text style={[styles.fabText, { color: colors.background }]}>
            SUPPORT
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
// Using static colors for base styles (performance optimization)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },

  // Centered Containers
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Hero Section
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.85,
    marginBottom: 15,
  },
  heroDivider: {
    width: 170,
    height: 3,
    borderRadius: 2,
  },

  // Filter Bar
  filterContainer: {
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  filterButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  filterButtonTextActive: {
    // Color set dynamically
  },

  // Game Cards
  gamesList: {
    paddingHorizontal: 20,
  },
  gameCard: {
    // Styles handled by GameCard component
  },

  // Section Headers
  sectionGroup: {
    marginBottom: 30,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fabText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default MainScreen;