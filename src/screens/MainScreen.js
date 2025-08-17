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
import CategoryFilter from './CategoryFilter';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useNovaExperience } from 'nova-react-sdk'; // NOVA SDK

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Simple Hero Section
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, selectedCategory, filteredCount, colors, heroTitle }) => {
  const getCategoryText = () => {
    if (selectedCategory === 'all') return '';
    return `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} - `;
  };
  return (
    <View style={[styles.heroContainer]}>
      <Text style={[styles.heroTitle, { color: colors.accent, textShadowColor: colors.accentGlow }]}>
        {heroTitle}
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.lightText }]}>
        {selectedSection === 'all' && selectedCategory === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${getCategoryText()}${selectedSection === 'all' ? 'items' : selectedSection + ' assets'}`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.accent }]} />
    </View>
  );
});

// Clean Filter Bar
const CleanGamingFilter = React.memo(({ sections, selectedSection, onSectionChange, colors, sectionConfigs }) => {
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
              shadowColor: colors.accentGlow,
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
          const config = sectionConfigs[section.toLowerCase()] || { emoji: '🎮', name: section };
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
                  shadowColor: colors.accentGlow,
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
const SimpleSectionHeader = React.memo(({ title, count, colors }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title.toUpperCase()}</Text>
    <Text style={[styles.sectionCount, { color: colors.mutedText }]}>{count} Assets</Text>
  </View>
));

// Loading State
const SimpleLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={[styles.loadingText, { color: colors.lightText }]}>Loading Assets...</Text>
  </View>
));

// Error State
const SimpleErrorState = React.memo(({ error, onRetry, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
    <TouchableOpacity
      style={[styles.retryButton, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
      onPress={onRetry}
    >
      <Text style={[styles.retryButtonText, { color: colors.text }]}>Retry</Text>
    </TouchableOpacity>
  </View>
));

// Empty State
const SimpleEmptyState = React.memo(({ selectedSection, selectedCategory, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.emptyText, { color: colors.mutedText }]}>
      No {selectedCategory !== 'all' ? selectedCategory : ''} {selectedSection !== 'all' ? selectedSection : ''} assets found.
    </Text>
  </View>
));

const MainScreen = () => {
  // Nova SDK hook to load experience configs & data
  const { objects, loaded: novaLoaded } = useNovaExperience("home");

  // Extract Nova configs & theme
  const uiTheme = objects?.["ui-theme"];
  const gameSections = objects?.["game-sections"];
  const appConfig = objects?.["app-config"];
  const novaGameAssetsObj = objects?.["game-assets"];

  const colors = uiTheme || {};

  const defaultSection = gameSections?.defaultSection || 'all';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]); 
  const [novaAssets, setNovaAssets] = useState([]); 
  const [sections, setSections] = useState(gameSections?.sections || []);
  const [categories, setCategories] = useState(['all']);
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { balance } = useUser();

  // Load Firebase game assets
  const loadFirebaseGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const assets = await fetchGameAssets();

      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
        tag: asset.tag?.toLowerCase() || 'uncategorized',
      }));

      if (normalizedAssets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(normalizedAssets);

        if (gameSections?.sections && gameSections.sections.length > 0) {
          setSections(gameSections.sections);
        } else {
          const uniqueSections = [...new Set(normalizedAssets.map(g => g.section).filter(Boolean))].sort();
          setSections(uniqueSections);
        }

        const uniqueTags = ['all', ...Array.from(new Set(normalizedAssets.map(g => g.tag).filter(Boolean)))];
        setCategories(uniqueTags);

        setSelectedCategory('all');
      }
    } catch (err) {
      console.error('Error loading Firebase game assets:', err);
      setError('Failed to load game assets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [gameSections]);

  // Load Nova SDK assets when available
  const loadNovaGameAssets = useCallback(() => {
    try {
      if (novaGameAssetsObj?.content) {
        try {
          const raw = novaGameAssetsObj.content;
          const assets = typeof raw === "string" ? JSON.parse(raw) : raw;
          const normalizedAssets = assets.map(asset => ({
            ...asset,
            section: asset.section || 'survival',
            tag: asset.tag?.toLowerCase() || 'uncategorized',
          }));
          setNovaAssets(normalizedAssets);
        } catch (err) {
          console.error('Error parsing Nova game assets:', err);
          setNovaAssets([]);
        }
      } else {
        setNovaAssets([]);
      }
    } catch (err) {
      console.error('Error loading Nova game assets:', err);
      setNovaAssets([]);
    }
  }, [novaGameAssetsObj]);

  useEffect(() => {
    loadFirebaseGameAssets();
  }, [loadFirebaseGameAssets]);

  useEffect(() => {
    if (novaLoaded) {
      loadNovaGameAssets();
    }
  }, [novaLoaded, loadNovaGameAssets]);

  // Filtering logic for Firebase assets
  const filteredGames = useMemo(() => {
    let filtered = gameAssets;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => game.tag === selectedCategory);
    }
    if (selectedSection !== 'all') {
      filtered = filtered.filter(game => game.section === selectedSection);
    }
    return filtered;
  }, [gameAssets, selectedSection, selectedCategory]);

  // Group by section for all-section view
  const groupedGames = useMemo(() => {
    let gamesToGroup = gameAssets;
    if (selectedCategory !== 'all') {
      gamesToGroup = gamesToGroup.filter(game => game.tag === selectedCategory);
    }
    return sections.reduce((acc, section) => {
      acc[section] = gamesToGroup.filter(g => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections, selectedCategory]);

  // Section configs (Nova or default)
  let sectionConfigs = {
    survival: { emoji: '🌲', name: 'Survival' },
    lifesteal: { emoji: '⚔', name: 'Lifesteal' },
    creative: { emoji: '🎨', name: 'Creative' },
    pvp: { emoji: '⚡', name: 'PvP' },
    skyblock: { emoji: '☁', name: 'Skyblock' },
    prison: { emoji: '🔒', name: 'Prison' },
  };
  if (gameSections?.sectionConfigs) {
    try {
      sectionConfigs = typeof gameSections.sectionConfigs === 'string'
        ? JSON.parse(gameSections.sectionConfigs)
        : gameSections.sectionConfigs;
    } catch {
      // fallback is already above
    }
  }

  // Render game content
  const renderGameContent = () => {
    // Personalised assets (Nova)
    const content = [];

    if (novaAssets.length > 0) {
      content.push(
        <View key="personalised" style={styles.sectionGroup}>
          <SimpleSectionHeader title="Personalised Assets" count={novaAssets.length} colors={colors} />
          <View style={styles.gamesList}>
            {novaAssets.map((game, index) => (
              <AnimatedGameCard key={game.id || `nova-${index}`} game={game} index={index} />
            ))}
          </View>
        </View>
      );
    }

    if (filteredGames.length === 0 && novaAssets.length === 0) {
      return <SimpleEmptyState selectedSection={selectedSection} selectedCategory={selectedCategory} colors={colors} />;
    }
    
    if (selectedSection === 'all') {
      sections.forEach(section => {
        const sectionGames = groupedGames[section];
        if (sectionGames.length === 0) return;
        content.push(
          <View key={section} style={styles.sectionGroup}>
            <SimpleSectionHeader title={section.charAt(0).toUpperCase() + section.slice(1)} count={sectionGames.length} colors={colors} />
            <View style={styles.gamesList}>
              {sectionGames.map((game, index) => (
                <AnimatedGameCard key={game.id || `${section}-${index}`} game={game} index={index} />
              ))}
            </View>
          </View>
        );
      });
    } else {
      content.push(
        <View key="filtered" style={styles.gamesList}>
          {filteredGames.map((game, index) => (
            <AnimatedGameCard key={game.id || `filtered-${index}`} game={game} index={index} />
          ))}
        </View>
      );
    }

    return content;
  };

  // Loading or error UI
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
        <SimpleErrorState error={error} onRetry={loadFirebaseGameAssets} colors={colors} />
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
          gameCount={gameAssets.length + novaAssets.length}
          selectedSection={selectedSection}
          selectedCategory={selectedCategory}
          filteredCount={filteredGames.length}
          colors={colors}
          heroTitle={appConfig?.heroTitle || "GAME ASSETS"}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          colors={colors}
        />
        <CleanGamingFilter
          sections={sections}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          colors={colors}
          sectionConfigs={sectionConfigs}
        />
        {renderGameContent()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      {/* Support FAB uses Nova config */}
      <TouchableOpacity
        style={[styles.fab, { shadowColor: colors.fabShadow }]}
        activeOpacity={0.8}
        onPress={() => Linking.openURL(appConfig?.supportUrl || 'https://t.me/xgamingclub')}
      >
        <LinearGradient colors={colors.activeGradient} style={styles.fabGradient}>
          <Text style={[styles.fabText, { color: colors.background }]}>
            {appConfig?.supportButtonText || 'SUPPORT'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 100 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
  retryButtonText: { fontWeight: 'bold' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  heroContainer: { paddingHorizontal: 20, paddingVertical: 25, marginBottom: 10 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  heroSubtitle: { fontSize: 15, fontWeight: '600', opacity: 0.85, marginBottom: 15 },
  heroDivider: { width: 170, height: 3, borderRadius: 2 },
  filterContainer: { marginBottom: 20, paddingVertical: 10, borderBottomWidth: 1 },
  filterScrollContent: { paddingHorizontal: 20, gap: 10 },
  filterButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  filterButtonActive: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8 },
  filterButtonText: { fontWeight: '700', fontSize: 13 },
  filterButtonTextActive: {},
  gamesList: { paddingHorizontal: 20 },
  gameCard: {},
  sectionGroup: { marginBottom: 30 },
  sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  sectionCount: { fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 30 : 20, borderRadius: 25, overflow: 'hidden', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  fabText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  bottomSpacer: { height: 20 },
});

export default MainScreen;
