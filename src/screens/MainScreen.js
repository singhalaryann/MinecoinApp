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
import { useNovaExperience } from 'nova-react-sdk';
import NovaDebugPanel from '../components/common/NovaDebugPanel';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Hero Section
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, selectedCategory, filteredCount, colors, heroTitle }) => {
  const getCategoryText = () => {
    if (selectedCategory === 'all') return '';
    return `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} - `;
  };
  return (
    <View style={[styles.heroContainer]}>
      <Text style={[styles.heroTitle, { 
        color: colors.accent || '#10B981', 
        textShadowColor: colors.accentGlow || 'rgba(16, 185, 129, 0.25)' 
      }]}>
        {heroTitle}
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.lightText || '#D1D5DB' }]}>
        {selectedSection === 'all' && selectedCategory === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${getCategoryText()}${selectedSection === 'all' ? 'items' : selectedSection + ' assets'}`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.accent || '#10B981' }]} />
    </View>
  );
});

// Filter Bar
const CleanGamingFilter = React.memo(({ sections, selectedSection, onSectionChange, colors, sectionConfigs }) => {
  return (
    <View style={[styles.filterContainer, { borderBottomColor: colors.border || 'rgba(59, 130, 246, 0.2)' }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: colors.card || 'rgba(17, 24, 39, 0.95)', 
              borderColor: colors.border || 'rgba(59, 130, 246, 0.2)' 
            },
            selectedSection === 'all' && [styles.filterButtonActive, {
              backgroundColor: colors.accent || '#10B981',
              borderColor: colors.accent || '#10B981',
              shadowColor: colors.accentGlow || 'rgba(16, 185, 129, 0.25)',
            }],
          ]}
          onPress={() => onSectionChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText,
            { color: colors.lightText || '#D1D5DB' },
            selectedSection === 'all' && [styles.filterButtonTextActive, { color: colors.text || '#F3F4F6' }]
          ]}>
            🎮 All Games
          </Text>
        </TouchableOpacity>
        {Array.isArray(sections) ? sections.map((section) => {
          const config = sectionConfigs[section.toLowerCase()] || { emoji: '🎮', name: section };
          const isActive = selectedSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: colors.card || 'rgba(17, 24, 39, 0.95)', 
                  borderColor: colors.border || 'rgba(59, 130, 246, 0.2)' 
                },
                isActive && [styles.filterButtonActive, {
                  backgroundColor: colors.accent || '#10B981',
                  borderColor: colors.accent || '#10B981',
                  shadowColor: colors.accentGlow || 'rgba(16, 185, 129, 0.25)',
                }],
              ]}
              onPress={() => onSectionChange(section)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { color: colors.lightText || '#D1D5DB' },
                isActive && [styles.filterButtonTextActive, { color: colors.text || '#F3F4F6' }]
              ]}>
                {config.emoji} {config.name}
              </Text>
            </TouchableOpacity>
          );
        }) : null}
      </ScrollView>
    </View>
  );
});

// Game Card
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
    <Text style={[styles.sectionTitle, { color: colors.text || '#F3F4F6' }]}>{title.toUpperCase()}</Text>
    <Text style={[styles.sectionCount, { color: colors.mutedText || '#6B7280' }]}>{count} Assets</Text>
  </View>
));

// Loading
const SimpleLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent || '#10B981'} />
    <Text style={[styles.loadingText, { color: colors.lightText || '#D1D5DB' }]}>Loading Assets...</Text>
  </View>
));

// Error
const SimpleErrorState = React.memo(({ error, onRetry, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.errorText, { color: colors.error || '#EF4444' }]}>Error: {error}</Text>
    <TouchableOpacity
      style={[styles.retryButton, { 
        backgroundColor: colors.primary || '#3B82F6', 
        shadowColor: colors.shadow || '#1E3A8A' 
      }]}
      onPress={onRetry}
    >
      <Text style={[styles.retryButtonText, { color: colors.text || '#F3F4F6' }]}>Retry</Text>
    </TouchableOpacity>
  </View>
));

// Empty
const SimpleEmptyState = React.memo(({ selectedSection, selectedCategory, colors }) => (
  <View style={styles.centeredContainer}>
    <Text style={[styles.emptyText, { color: colors.mutedText || '#6B7280' }]}>
      No {selectedCategory !== 'all' ? selectedCategory : ''} {selectedSection !== 'all' ? selectedSection : ''} assets found.
    </Text>
  </View>
));

const MainScreen = () => {
  // Nova SDK hook to load experience configs & data
  const { objects, loaded: novaLoaded, error: novaError } = useNovaExperience("home");

  // Log Nova state for debugging
  console.log('🔍 MainScreen Nova state:', {
    objects: objects ? Object.keys(objects) : 'undefined',
    loaded: novaLoaded,
    error: novaError,
    uiTheme: objects?.["ui-theme"] ? 'loaded' : 'not loaded'
  });

  // --- Real-time Nova config extraction ---
  const uiTheme = objects?.["ui-theme"];
  const gameSections = objects?.["game-sections"];
  const appConfig = objects?.["app-config"];
  const novaGameAssetsObj = objects?.["game-assets"];
  
  // Provide default colors if Nova theme hasn't loaded yet
  const colors = uiTheme || {
    primary: '#3B82F6',
    primaryDark: '#1E3A8A',
    primaryLight: '#93C5FD',
    primaryFaded: 'rgba(59, 130, 246, 0.1)',
    accent: '#10B981',
    accentDark: '#059669',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    highlight: '#EC4899',
    highlightGlow: 'rgba(236, 72, 153, 0.2)',
    background: '#0A0A0A',
    backgroundLight: '#111827',
    card: 'rgba(17, 24, 39, 0.95)',
    text: '#F3F4F6',
    lightText: '#D1D5DB',
    mutedText: '#6B7280',
    border: 'rgba(59, 130, 246, 0.2)',
    borderStrong: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)',
    inactiveButton: ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
    activeGradient: ['#10B981', '#10B981'],
    dangerGradient: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'],
    loadingGradient: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)'],
    shadow: '#1E3A8A',
    fabShadow: '#10B981',
    gradientDark: ['#0A0A0A', '#111827', '#0A0A0A'],
    sectionUnderline: '#93C5FD',
    error: '#EF4444'
  };

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

  const defaultSection = gameSections?.defaultSection || 'all';

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]); // Firebase
  const [novaAssets, setNovaAssets] = useState([]); // Nova
  const [sections, setSections] = useState(gameSections?.sections || []);
  const [categories, setCategories] = useState(['all']);
  const [selectedSection, setSelectedSection] = useState(defaultSection);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const { balance } = useUser();

  // --- Load Firebase game assets ---
  const loadFirebaseGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const assets = await fetchGameAssets();
      const normalizedAssets = Array.isArray(assets)
        ? assets.map(asset => ({
          ...asset,
          section: asset.section || 'survival',
          tag: asset.tag?.toLowerCase() || 'uncategorized',
        })) : [];
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

  // --- Load Nova SDK assets (with array type check) ---
  const loadNovaGameAssets = useCallback(() => {
    console.log('🔄 Loading Nova game assets:', {
      hasContent: !!novaGameAssetsObj?.content,
      contentType: typeof novaGameAssetsObj?.content,
      content: novaGameAssetsObj?.content
    });

    if (novaGameAssetsObj?.content) {
      let assets;
      if (typeof novaGameAssetsObj.content === "string") {
        try {
          assets = JSON.parse(novaGameAssetsObj.content);
          console.log('✅ Parsed Nova assets from string:', assets);
        } catch (parseError) {
          console.error('❌ Failed to parse Nova assets string:', parseError);
          assets = [];
        }
      } else {
        assets = novaGameAssetsObj.content;
        console.log('📦 Using Nova assets directly:', assets);
      }
      
      if (!Array.isArray(assets)) {
        console.warn('⚠️ Nova assets is not an array, converting to array');
        assets = [];
      }
      
      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
        tag: asset.tag?.toLowerCase() || 'uncategorized',
      }));
      
      console.log('🎯 Normalized Nova assets:', normalizedAssets);
      setNovaAssets(normalizedAssets);
    } else {
      console.log('📭 No Nova game assets content available');
      setNovaAssets([]);
    }
  }, [novaGameAssetsObj]);

  // --- Effects ---
  useEffect(() => {
    loadFirebaseGameAssets();
  }, [loadFirebaseGameAssets]);

  useEffect(() => {
    console.log('🔄 Nova loading effect triggered:', { novaLoaded, novaError });
    if (novaLoaded && !novaError) {
      console.log('✅ Nova loaded successfully, loading game assets');
      loadNovaGameAssets();
    } else if (novaError) {
      console.error('❌ Nova loading failed:', novaError);
    } else {
      console.log('⏳ Nova still loading...');
    }
  }, [novaLoaded, novaError, loadNovaGameAssets]);

  // Filtering logic for Firebase assets
  const filteredGames = useMemo(() => {
    if (!Array.isArray(gameAssets)) {
      console.warn('⚠️ gameAssets is not an array:', gameAssets);
      return [];
    }
    
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
    if (!Array.isArray(gameAssets)) {
      console.warn('⚠️ gameAssets is not an array in groupedGames:', gameAssets);
      return {};
    }
    
    if (!Array.isArray(sections)) {
      console.warn('⚠️ sections is not an array:', sections);
      return {};
    }
    
    let gamesToGroup = gameAssets;
    if (selectedCategory !== 'all') {
      gamesToGroup = gamesToGroup.filter(game => game.tag === selectedCategory);
    }
    return sections.reduce((acc, section) => {
      acc[section] = gamesToGroup.filter(g => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections, selectedCategory]);

  // --- Render game content (Nova and Firebase) ---
  const renderGameContent = () => {
    const content = [];

    // Safety check for novaAssets
    if (Array.isArray(novaAssets) && novaAssets.length > 0) {
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

    if (filteredGames.length === 0 && (!Array.isArray(novaAssets) || novaAssets.length === 0)) {
      return <SimpleEmptyState selectedSection={selectedSection} selectedCategory={selectedCategory} colors={colors} />;
    }
    
    if (selectedSection === 'all' && Array.isArray(sections)) {
      sections.forEach(section => {
        const sectionGames = groupedGames[section];
        if (!sectionGames || sectionGames.length === 0) return;
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
      if (Array.isArray(filteredGames)) {
        content.push(
          <View key="filtered" style={styles.gamesList}>
            {filteredGames.map((game, index) => (
              <AnimatedGameCard key={game.id || `filtered-${index}`} game={game} index={index} />
            ))}
          </View>
        );
      }
    }

    return content;
  };

  // Loading or error UI
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#0A0A0A' }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background || '#0A0A0A'} />
        <LinearGradient colors={colors.gradientDark || ['#0A0A0A', '#111827', '#0A0A0A']} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleLoadingState colors={colors} />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#0A0A0A' }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background || '#0A0A0A'} />
        <LinearGradient colors={colors.gradientDark || ['#0A0A0A', '#111827', '#0A0A0A']} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleErrorState error={error} onRetry={loadFirebaseGameAssets} colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background || '#0A0A0A' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background || '#0A0A0A'} />
      <LinearGradient colors={colors.gradientDark || ['#0A0A0A', '#111827', '#0A0A0A']} style={StyleSheet.absoluteFill} />
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
        style={[styles.fab, { shadowColor: colors.fabShadow || '#10b981' }]}
        activeOpacity={0.8}
        onPress={() => Linking.openURL(appConfig?.supportUrl || 'https://t.me/xgamingclub')}
      >
        <LinearGradient 
          colors={colors.activeGradient || ['#10B981', '#10B981']} 
          style={styles.fabGradient}
        >
          <Text style={[styles.fabText, { color: colors.background || '#0a0a0a' }]}>
            {appConfig?.supportButtonText || 'SUPPORT'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Nova Debug Button */}
      <TouchableOpacity
        style={[styles.debugFab, { shadowColor: colors.fabShadow || '#8b5cf6' }]}
        activeOpacity={0.8}
        onPress={() => setShowDebugPanel(true)}
      >
        <LinearGradient colors={['#8b5cf6', '#a855f7']} style={styles.fabGradient}>
          <Text style={[styles.fabText, { color: colors.background || '#0a0a0a' }]}>
            🔧
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Nova Debug Panel */}
      <NovaDebugPanel 
        visible={showDebugPanel} 
        onClose={() => setShowDebugPanel(false)} 
      />
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
  debugFab: { position: 'absolute', right: 20, bottom: Platform.OS === 'ios' ? 100 : 90, borderRadius: 25, overflow: 'hidden', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  fabText: { fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  bottomSpacer: { height: 20 },
});

export default MainScreen;
