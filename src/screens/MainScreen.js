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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import NotificationBanner from '../components/common/NotificationBanner';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useThemeColors, colors as staticColors } from './theme';
import { useNovaExperience } from 'nova-react-sdk';

// Cache key for Nova assets
const NOVA_ASSETS_CACHE_KEY = "nova_assets_cache";

// Cache functions
const cacheNovaAssets = async (assets, userId) => {
  try {
    const cacheData = { assets, userId, timestamp: Date.now() };
    await AsyncStorage.setItem(NOVA_ASSETS_CACHE_KEY, JSON.stringify(cacheData));
    console.log("💾 [CACHE] Nova assets cached for user:", userId);
  } catch (error) {
    console.error("❌ [CACHE] Failed to cache Nova assets:", error);
  }
};

const getCachedNovaAssets = async (userId) => {
  try {
    const cachedData = await AsyncStorage.getItem(NOVA_ASSETS_CACHE_KEY);
    if (!cachedData) {
      console.log("📭 [CACHE] No cached Nova assets found");
      return null;
    }

    const cache = JSON.parse(cachedData);
    if (cache.userId !== userId) {
      console.log("🔄 [CACHE] Cache userId mismatch, clearing cache");
      await AsyncStorage.removeItem(NOVA_ASSETS_CACHE_KEY);
      return null;
    }

    console.log("✅ [CACHE] Using cached Nova assets for user:", userId);
    return cache.assets;
  } catch (error) {
    console.error("❌ [CACHE] Error reading cached Nova assets:", error);
    return null;
  }
};

const clearNovaCache = async () => {
  try {
    await AsyncStorage.removeItem(NOVA_ASSETS_CACHE_KEY);
    console.log("🗑️ [CACHE] Nova cache cleared");
  } catch (error) {
    console.error("❌ [CACHE] Error clearing Nova cache:", error);
  }
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// ==================== COMPONENTS ====================

// Simple Hero Section
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, selectedTag, filteredCount, colors }) => {
  const getFilterText = () => {
    let text = '';
    if (selectedTag !== 'all') {
      const tagNames = { rank: 'Rank', keys: 'Key', companion: 'Companion', assets: 'Asset' };
      text += `${tagNames[selectedTag] || selectedTag} `;
    }
    if (selectedSection !== 'all') {
      text += `${selectedSection} `;
    }
    return text;
  };

  return (
    <View style={[styles.heroContainer]}>
      <Text style={[styles.heroTitle, { color: colors.accent, textShadowColor: colors.accentGlow }]}>
        GAME ASSETS
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.lightText }]}>
        {selectedSection === 'all' && selectedTag === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${getFilterText()}assets`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.accent }]} />
    </View>
  );
});

// Tags Filter Component
const TagsFilter = React.memo(({ tags, selectedTag, onTagChange, colors }) => {
  const tagConfigs = {
    all: { emoji: '🎮', name: 'All', color: colors.accent },
    rank: { emoji: '👑', name: 'Ranks', color: colors.highlight },
    keys: { emoji: '🔑', name: 'Keys', color: '#F59E0B' },
    companion: { emoji: '🐾', name: 'Companions', color: '#8B5CF6' },
    asset: { emoji: '💎', name: 'Asset', color: colors.primary },
  };

  return (
    <View style={[styles.tagsContainer, { borderBottomColor: colors.border }]}>
      <Text style={[styles.tagsLabel, { color: colors.mutedText }]}>FILTER BY TYPE:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsScrollContent}
      >
        {tags.map((tag) => {
          const config = tagConfigs[tag] || { emoji: '📦', name: tag, color: colors.accent };
          const isActive = selectedTag === tag;
          
          return (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                isActive && [styles.tagButtonActive, { 
                  backgroundColor: config.color, 
                  borderColor: config.color,
                  shadowColor: config.color 
                }],
              ]}
              onPress={() => onTagChange(tag)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tagButtonText,
                { color: colors.lightText },
                isActive && { color: '#FFFFFF' }
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

// Clean Filter Bar - Sections
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

// Simple Section Header with Clean Design
const SimpleSectionHeader = React.memo(({ title, count, colors, isNova = false }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title.toUpperCase()}
        </Text>
        {isNova && (
          <View style={[styles.novaBadge, { backgroundColor: colors.highlight }]}>
            <Text style={styles.novaBadgeText}>NOVA</Text>
          </View>
        )}
      </View>
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
      Loading Game Data...
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
const SimpleEmptyState = React.memo(({ selectedSection, selectedTag, colors }) => {
  const getEmptyMessage = () => {
    let message = 'No ';
    if (selectedTag !== 'all') {
      const tagNames = { rank: 'rank', keys: 'key', companion: 'companion', assets: 'asset' };
      message += `${tagNames[selectedTag] || selectedTag} `;
    }
    if (selectedSection !== 'all') {
      message += `${selectedSection} `;
    }
    message += 'assets found.';
    return message;
  };

  return (
    <View style={styles.centeredContainer}>
      <Text style={[styles.emptyText, { color: colors.mutedText }]}>
        {getEmptyMessage()}
      </Text>
    </View>
  );
});

// ==================== MAIN COMPONENT ====================

const MainScreen = () => {
  console.log("🎬 [MAIN] MainScreen component rendering");
  
  // Get theme colors
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  // Get auth state
  const { user, isNovaReady } = useAuth();
  const { balance } = useUser();
  
  // Get Nova experience data
  const { objects, loaded: novaLoaded, error: novaError } = useNovaExperience(
    user && isNovaReady ? "home" : null
  );
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const [novaAssets, setNovaAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [tags] = useState(['all', 'asset', 'companion', 'keys', 'rank']);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [dataReady, setDataReady] = useState(false);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);
  const [novaProcessed, setNovaProcessed] = useState(false);
  
  // Ref to prevent multiple simultaneous processing
  const isProcessingNova = useRef(false);
  const lastProcessedObjects = useRef(null);
  
  // Unified loading state
  const isLoading = loading || (user && !isNovaReady) || (user && isNovaReady && !dataReady);
  
  // Load Firebase assets - only once on mount
  useEffect(() => {
    console.log("🚀 [INIT] Loading Firebase assets on mount");
    
    const loadFirebase = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const assets = await fetchGameAssets();
        
        const normalizedAssets = assets.map(asset => ({
          ...asset,
          section: asset.section || 'survival',
          tag: asset.tag || 'assets',
          isNova: false
        }));
        
        console.log(`✅ [FIREBASE] Loaded ${normalizedAssets.length} assets`);
        
        setGameAssets(normalizedAssets);
        setFirebaseLoaded(true);
        
        // Sections will be updated by the centralized useEffect
        
      } catch (err) {
        console.error('❌ [FIREBASE] Error:', err);
        setError('Failed to load game assets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFirebase();
  }, []); // Only on mount
  
  // Handle user login/logout for Nova data
  useEffect(() => {
    if (!user) {
      console.log("🚪 [AUTH] User logged out - clearing Nova data");
      setNovaAssets([]);
      clearNovaCache();
      setNovaProcessed(true);
      setDataReady(true); // Ready to show Firebase only
    } else if (user && isNovaReady && !isProcessingNova.current) {
      console.log("👤 [AUTH] User logged in - loading Nova data");
      
      // Clear old Nova data immediately
      setNovaAssets([]);
      
      // Reset Nova session to force fresh data
      const resetNovaSession = async () => {
        try {
          console.log("🔄 [NOVA] Resetting Nova session for fresh data");
          // Force Nova to reload experiences and game-assets
          await window.nova?.reloadExperiences?.();
          console.log("✅ [NOVA] Nova session reset successfully");
        } catch (error) {
          console.log("⚠️ [NOVA] Could not reset Nova session:", error);
        }
      };
      
      // Reset Nova session first
      resetNovaSession();
      
      // Reset novaProcessed to allow Nova processing to run
      setNovaProcessed(false);
      
      // Don't load cache on login - wait for fresh Nova data
      console.log("📭 [CACHE] Skipping cache on login - waiting for fresh Nova data");
    }  }, [user, isNovaReady]);
  
  // Process Nova objects when they load
  useEffect(() => {
    console.log("🔍 [NOVA] useEffect triggered:", { 
      user: !!user, 
      isNovaReady, 
      novaLoaded, 
      hasObjects: !!objects, 
      isProcessing: isProcessingNova.current, 
      novaProcessed 
    });
    
    if (!user || !isNovaReady || !novaLoaded || !objects || isProcessingNova.current || novaProcessed) {
      if (!user || !isNovaReady) {
        setNovaProcessed(true);
        setDataReady(true); // Mark ready even without Nova
      }
      return;
    }
    
    // Check if objects have actually changed
    const objectsKey = JSON.stringify(objects);
    if (lastProcessedObjects.current === objectsKey) {
      console.log("🔄 [NOVA] Objects unchanged, skipping processing");
      return;
    }
    
    console.log("📦 [NOVA] Processing Nova objects");
    console.log("📊 [NOVA] Objects received:", Object.keys(objects || {}));
    isProcessingNova.current = true;
    lastProcessedObjects.current = objectsKey;
    
    const processNova = async () => {
      try {
        if (!objects['game-assets']?.content) {
          console.log("⚠️ [NOVA] No game-assets found");
          setNovaProcessed(true);
          setDataReady(true);
          return;
        }
        
        const content = typeof objects['game-assets'].content === 'string' 
          ? JSON.parse(objects['game-assets'].content) 
          : objects['game-assets'].content;
        
        const processedAssets = [];
        
        if (Array.isArray(content)) {
          content.forEach((asset) => {
            processedAssets.push({
              ...asset,
              novaSource: 'game-assets',
              isNova: true
            });
          });
        } else {
          Object.values(content).forEach((asset) => {
            processedAssets.push({
              ...asset,
              novaSource: 'game-assets',
              isNova: true
            });
          });
        }
        
        console.log(`✅ [NOVA] Processed ${processedAssets.length} assets`);
        
        setNovaAssets(processedAssets);
        setNovaProcessed(true);
        
        // Cache the assets
        if (processedAssets.length > 0) {
          await cacheNovaAssets(processedAssets, user.email);
        }
        
        // Sections will be updated by the centralized useEffect
        
      } catch (e) {
        console.error('❌ [NOVA] Error:', e);
        setNovaProcessed(true);
      } finally {
        isProcessingNova.current = false;
      }
    };
    
    processNova();
  }, [user, isNovaReady, novaLoaded, novaProcessed, objects]);
  
  // Set data ready when both Firebase and Nova are processed
  useEffect(() => {
    if (firebaseLoaded && (novaProcessed || !user)) {
      console.log("✅ [SYNC] All data sources ready, marking data as ready");
      setDataReady(true);
    }
  }, [firebaseLoaded, novaProcessed, user]);
  
  // Update sections whenever gameAssets or novaAssets change
  useEffect(() => {
    const allAssets = [...gameAssets, ...novaAssets];
    const uniqueSections = [
      ...new Set(allAssets.map((g) => g.section).filter(Boolean))
    ].sort();
    
    // Only update if sections actually changed
    setSections(prevSections => {
      if (JSON.stringify(prevSections) === JSON.stringify(uniqueSections)) {
        return prevSections;
      }
      return uniqueSections;
    });
  }, [gameAssets, novaAssets]);
  
  // Filtered assets
  const filteredGames = useMemo(() => {
    let filtered = [...gameAssets];
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter((g) => g.section === selectedSection);
    }
    
    if (selectedTag !== 'all') {
      filtered = filtered.filter((g) => g.tag === selectedTag);
    }
    
    return filtered;
  }, [gameAssets, selectedSection, selectedTag]);
  
  const filteredNovaAssets = useMemo(() => {
    let filtered = [...novaAssets];
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter((g) => g.section === selectedSection);
    }
    
    if (selectedTag !== 'all') {
      filtered = filtered.filter((g) => g.tag === selectedTag);
    }
    
    return filtered;
  }, [novaAssets, selectedSection, selectedTag]);
  
  const groupedGames = useMemo(() => {
    let gamesToGroup = gameAssets;
    
    if (selectedTag !== 'all') {
      gamesToGroup = gamesToGroup.filter((g) => g.tag === selectedTag);
    }
    
    return sections.reduce((acc, section) => {
      acc[section] = gamesToGroup.filter((g) => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections, selectedTag]);
  
  // Render game content
  const renderGameContent = () => {
    const hasNovaAssets = filteredNovaAssets.length > 0;
    const hasFirebaseAssets = filteredGames.length > 0;
    
    if (!hasNovaAssets && !hasFirebaseAssets) {
      return <SimpleEmptyState selectedSection={selectedSection} selectedTag={selectedTag} colors={colors} />;
    }
    
    const content = [];
    
    // Show Nova assets first (only if user is logged in)
    if (hasNovaAssets && user) {
      content.push(
        <View key="nova-section" style={styles.sectionGroup}>
          <SimpleSectionHeader
            title="Featured Assets"
            count={filteredNovaAssets.length}
            colors={colors}
            isNova={true}
          />
          <View style={styles.gamesList}>
            {filteredNovaAssets.map((game, index) => (
              <AnimatedGameCard
                key={`nova-${game.id || index}`}
                game={game}
                index={index}
              />
            ))}
          </View>
        </View>
      );
    }
    
    // Show Firebase assets
    if (hasFirebaseAssets) {
      if (selectedSection === 'all') {
        sections.forEach((section) => {
          const sectionGames = groupedGames[section];
          if (sectionGames.length === 0) return;
          
          content.push(
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
        content.push(
          <View key="filtered" style={styles.sectionGroup}>
            <SimpleSectionHeader
              title="Game Assets"
              count={filteredGames.length}
              colors={colors}
            />
            <View style={styles.gamesList}>
              {filteredGames.map((game, index) => (
                <AnimatedGameCard
                  key={game.id}
                  game={game}
                  index={index}
                />
              ))}
            </View>
          </View>
        );
      }
    }
    
    return content;
  };
  
  console.log(`📱 [RENDER] State: Loading=${loading}, FirebaseLoaded=${firebaseLoaded}, NovaProcessed=${novaProcessed}, User=${!!user}, NovaReady=${isNovaReady}, DataReady=${dataReady}`);
  
  if (isLoading) {
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
        <SimpleErrorState error={error} onRetry={() => window.location.reload()} colors={colors} />
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
        {/* Subtle Animated Background Pattern */}
        <View style={styles.backgroundPattern} />
        
        <SimpleGamingHero
          gameCount={gameAssets.length + novaAssets.length}
          selectedSection={selectedSection}
          selectedTag={selectedTag}
          filteredCount={filteredGames.length + filteredNovaAssets.length}
          colors={colors}
        />

        <TagsFilter
          tags={tags}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Hero Section - Clean and Simple
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 15,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 18,
    textAlign: 'center',
  },
  heroDivider: {
    width: 200,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },

  // Enhanced Tags Filter - Glass Morphism
  tagsContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.15)',
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 20,
    marginBottom: 12,
    color: '#00D4FF',
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  tagButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tagButtonActive: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  tagButtonText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Enhanced Filter Bar - Modern Gaming Style
  filterContainer: {
    marginBottom: 25,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.15)',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  filterButtonActive: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.08 }],
  },
  filterButtonText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {},

  // Game Cards - Enhanced Spacing
  gamesList: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  gameCard: {},

  // Enhanced Section Headers - Clean and Simple
  sectionGroup: {
    marginBottom: 35,
    paddingVertical: 10,
    marginHorizontal: 15,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
    paddingTop: 5,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
    textShadowOffset: { width: 0, height: 2 },
    textShadowOpacity: 0.3,
    textShadowRadius: 4,
  },
  sectionCount: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.8,
  },
  
  // Enhanced Nova Badge - Simple and Clean
  novaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  novaBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  // Enhanced FAB - Clean and Simple
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 20,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    transform: [{ scale: 1.02 }],
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  fabText: {
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: 30,
  },
  // Subtle Animated Background Pattern
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // A very subtle background
    zIndex: -1, // Ensure it's behind other content
  },
});

export default MainScreen;
