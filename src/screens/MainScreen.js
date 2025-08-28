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
import { useNovaExperience } from 'nova-react-sdk'; // NEW: Import Nova experience hook

// Simple cache key for Nova assets
const NOVA_ASSETS_CACHE_KEY = "nova_assets_cache";

// Simple cache functions
const cacheNovaAssets = async (assets, userId) => {
  try {
    const cacheData = { assets, userId, timestamp: Date.now() };
    await AsyncStorage.setItem(NOVA_ASSETS_CACHE_KEY, JSON.stringify(cacheData));
    console.log("💾 Nova assets cached for user:", userId);
  } catch (error) {
    console.error("❌ Failed to cache Nova assets:", error);
  }
};

const getCachedNovaAssets = async (userId) => {
  try {
    const cachedData = await AsyncStorage.getItem(NOVA_ASSETS_CACHE_KEY);
    if (!cachedData) return null;

    const cache = JSON.parse(cachedData);
    if (cache.userId !== userId) {
      await AsyncStorage.removeItem(NOVA_ASSETS_CACHE_KEY);
      return null;
    }

    console.log("✅ Using cached Nova assets for user:", userId);
    return cache.assets;
  } catch (error) {
    console.error("❌ Error reading cached Nova assets:", error);
    return null;
  }
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// ==================== COMPONENTS ====================

// Simple Hero Section - UPDATED to show tag info
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, selectedTag, filteredCount, colors }) => {
  // NEW: Add tag text to subtitle
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
      <Text style={[styles.heroTitle, { color: colors.accent, textShadowColor: colors.accent }]}>
        GAME ASSETS
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.text }]}>
        {selectedSection === 'all' && selectedTag === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${getFilterText()}assets`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.accent }]} />
    </View>
  );
});

// NEW: Tags Filter Component
const TagsFilter = React.memo(({ tags, selectedTag, onTagChange, colors }) => {
  console.log('🏷️ TagsFilter Render - Available tags:', tags, 'Selected:', selectedTag);
  
  const tagConfigs = {
    all: { emoji: '🎮', name: 'All', color: colors.accent },
    rank: { emoji: '👑', name: 'Ranks', color: colors.accent },
    keys: { emoji: '🔑', name: 'Keys', color: colors.warning },
    companion: { emoji: '🐾', name: 'Companions', color: colors.accent + "22" },
    asset: { emoji: '💎', name: 'Asset', color: colors.accent + "22" },
  };

  return (
    <View style={[styles.tagsContainer, { borderBottomColor: colors.border }]}>
      <Text style={[styles.tagsLabel, { color: colors.text }]}>FILTER BY TYPE:</Text>
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
              onPress={() => {
                console.log('🔄 Tag selected:', tag);
                onTagChange(tag);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tagButtonText,
                { color: colors.text },
                isActive && { color: colors.white }
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
              shadowColor: colors.accent 
            }],
          ]}
          onPress={() => onSectionChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText, 
            { color: colors.text },
            selectedSection === 'all' && [styles.filterButtonTextActive, { color: colors.white }]
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
                  shadowColor: colors.accent 
                }],
              ]}
              onPress={() => onSectionChange(section)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { color: colors.text },
                isActive && [styles.filterButtonTextActive, { color: colors.white }]
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

// Section Header
const SimpleSectionHeader = React.memo(({ title, count, colors, isNova = false }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title.toUpperCase()}
        </Text>
        {isNova && (
                  <View style={[styles.novaBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.novaBadgeText, { color: colors.white }]}>NOVA</Text>
        </View>
        )}
      </View>
              <Text style={[styles.sectionCount, { color: colors.text }]}>
          {count} Assets
        </Text>
    </View>
  );
});

// Loading State
const SimpleLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Loading Assets...
    </Text>
  </View>
));

// Nova Loading State
const NovaLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Loading Nova Dashboard...
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
      style={[styles.retryButton, { backgroundColor: colors.accent + "22", shadowColor: colors.shadow }]} 
      onPress={onRetry}
    >
              <Text style={[styles.retryButtonText, { color: colors.white }]}>
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
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {getEmptyMessage()}
      </Text>
    </View>
  );
});

// ==================== MAIN COMPONENT ====================

const MainScreen = () => {
  // Get live theme colors from Nova dashboard
  const themeColors = useThemeColors();
  
  // Safety check - ensure colors are loaded before rendering
  if (!themeColors) {
    return null; // Don't render until colors are ready
  }
  
  // Use theme colors for all styling
  const colors = themeColors;
  
  // Get Nova ready state from AuthContext
  const { isNovaReady } = useAuth();
  
  // NEW: Get Nova experience data for dashboard assets
  const { objects, loaded: novaLoaded, error: novaError } = useNovaExperience(isNovaReady ? "home" : null);

  // Animated Game Card - MOVED INSIDE to access colors
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
          colors={colors}
        />
      </Animated.View>
    );
  });
  
  // Clear Nova assets when user logs out - IMMEDIATE CLEAR
  useEffect(() => {
    if (!isNovaReady) {
      setNovaAssets([]);
      setSections([]); // Also clear sections immediately
    }
  }, [isNovaReady]);

  // Force refresh when user state changes (login/logout) - IMMEDIATE CLEAR
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      // IMMEDIATE CLEAR: Clear Nova data instantly on logout
      setNovaAssets([]);
      setSections([]);
      setLoading(false); // Stop any loading state
      
      // Clear Nova cache immediately to prevent loading flash
      const clearNovaCache = async () => {
        try {
          await AsyncStorage.removeItem(NOVA_ASSETS_CACHE_KEY);
          console.log("🗑️ Nova cache cleared immediately on logout");
        } catch (error) {
          console.error("❌ Error clearing Nova cache:", error);
        }
      };
      clearNovaCache();
      
      // IMMEDIATELY load Firebase assets after clearing Nova to show them instantly
      loadGameAssets();
      
      console.log("🚫 User logged out - Nova data cleared immediately, Firebase assets loading");
    } else if (user) {
      // IMMEDIATELY load Firebase assets when user logs in to show them instantly
      // Force load without waiting for Nova to be ready
      const forceLoadFirebase = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 Force loading Firebase assets on login...');
          const assets = await fetchGameAssets();
          
          const normalizedAssets = assets.map(asset => ({
            ...asset,
            section: asset.section || 'survival',
            tag: asset.tag || 'assets',
            isNova: false
          }));
          
          console.log('📊 Firebase Assets Force Loaded:', {
            total: normalizedAssets.length,
            tags: [...new Set(normalizedAssets.map(a => a.tag))],
            sections: [...new Set(normalizedAssets.map(a => a.section))]
          });
          
          if (normalizedAssets.length === 0) {
            setError('No game assets available');
          } else {
            setGameAssets(normalizedAssets);
            
            // Extract unique sections
            const uniqueSections = [
              ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
            ].sort();
            setSections(uniqueSections);
            
            console.log('🏷️ Permanent tags (never change):', tags);
          }
        } catch (err) {
          console.error('❌ Error force loading Firebase assets:', err);
          setError('Failed to load game assets. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      forceLoadFirebase();
      console.log("✅ User logged in - Firebase assets force loading immediately");
    }
  }, [user]);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const [novaAssets, setNovaAssets] = useState([]); // NEW: Nova dashboard assets
  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState(['all', 'asset', 'companion', 'keys', 'rank']); // PERMANENT tags
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all'); // NEW: Selected tag filter
  const { balance } = useUser();

  // Check cache on mount
  useEffect(() => {
    const checkCachedNovaAssets = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.email || "guest";
          
          const cached = await getCachedNovaAssets(userId);
          if (cached) {
            setNovaAssets(cached);
            
            // Extract sections from cached assets (tags are permanent)
            const uniqueSections = [...new Set(cached.map(g => g.section).filter(Boolean))].sort();
            
            setSections(uniqueSections);
            // Tags are permanent - don't change them
            
            console.log("🎯 Using cached Nova assets for instant display");
          }
        }
      } catch (error) {
        console.error("❌ Error checking Nova assets cache:", error);
      }
    };

    checkCachedNovaAssets();
  }, []);

  // NEW: Process Nova dashboard assets - ONLY when user is logged in
  useEffect(() => {
    if (novaLoaded && objects && user) { // Only load Nova data when user exists
      console.log('🔍 Nova Objects Available:', Object.keys(objects || {}));
      
      // Check for different tag sections in Nova
      const tagSections = ['game-assets']; // Sirf yahi exists karta hai
      const combinedNovaAssets = [];
      
      tagSections.forEach(sectionKey => {
        if (objects[sectionKey]?.content) {
          try {
            const content = typeof objects[sectionKey].content === 'string' 
              ? JSON.parse(objects[sectionKey].content) 
              : objects[sectionKey].content;
            
            console.log(`📦 Nova ${sectionKey}:`, { 
              contentKeys: Object.keys(content || {}), 
              contentLength: Array.isArray(content) ? content.length : Object.keys(content).length
            });
            
            // Simple: Display all assets directly without priority/order
            if (Array.isArray(content)) {
              // If content is already an array, use it directly
              content.forEach((asset, index) => {
                combinedNovaAssets.push({
                  ...asset,
                  novaSource: sectionKey,
                  isNova: true
                });
              });
            } else {
              // If content is an object, convert to array
              Object.values(content).forEach((asset, index) => {
                combinedNovaAssets.push({
                  ...asset,
                  novaSource: sectionKey,
                  isNova: true
                });
              });
            }
          } catch (e) {
            console.error(`❌ Error parsing Nova ${sectionKey}:`, e);
          }
        }
      });
      
      console.log('✅ Processed Nova Assets:', {
        count: combinedNovaAssets.length,
        assets: combinedNovaAssets.map(a => ({ 
          title: a.title, 
          tag: a.tag 
        }))
      });
      
      // Cache Nova assets
      if (combinedNovaAssets.length > 0) {
        const cacheNovaAssetsAsync = async () => {
          try {
            const userData = await AsyncStorage.getItem("user");
            const userId = userData ? JSON.parse(userData).email : "guest";
            await cacheNovaAssets(combinedNovaAssets, userId);
          } catch (error) {
            console.error("❌ Error caching Nova assets:", error);
          }
        };
        cacheNovaAssetsAsync();
      }
      
      // Only update if the assets have actually changed
      setNovaAssets(prevAssets => {
        const prevAssetsString = JSON.stringify(prevAssets);
        const newAssetsString = JSON.stringify(combinedNovaAssets);
        
        if (prevAssetsString !== newAssetsString) {
          return combinedNovaAssets;
        }
        return prevAssets;
      });
      
      // Extract sections from Nova assets (tags are already persistent)
      const uniqueSections = [...new Set(combinedNovaAssets.map(g => g.section).filter(Boolean))].sort();
      
      // Only update sections if changed
      setSections(prevSections => {
        const prevSectionsString = JSON.stringify(prevSections);
        const newSectionsString = JSON.stringify(uniqueSections);
        
        if (prevSectionsString !== newSectionsString) {
          return uniqueSections;
        }
        return prevSections;
      });
      
      // Tags are persistent - don't change them
      console.log('🏷️ Keeping persistent tags:', tags);
    }
  }, [novaLoaded, objects]);

  const loadGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading Firebase game assets...');
      const assets = await fetchGameAssets();
      
      console.log('📦 Raw Firebase assets received:', assets.length);
      
      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
        tag: asset.tag || 'assets', // NEW: Ensure tag field exists
        isNova: false
      }));
      
      console.log('📊 Firebase Assets Loaded:', {
        total: normalizedAssets.length,
        tags: [...new Set(normalizedAssets.map(a => a.tag))],
        sections: [...new Set(normalizedAssets.map(a => a.section))],
        sampleAsset: normalizedAssets[0] ? {
          id: normalizedAssets[0].id,
          title: normalizedAssets[0].title,
          section: normalizedAssets[0].section,
          tag: normalizedAssets[0].tag
        } : null
      });
      
      if (normalizedAssets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(normalizedAssets);
        
        // Extract unique sections
        const uniqueSections = [
          ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
        ].sort();
        setSections(uniqueSections);
        
        console.log('🏷️ Permanent tags (never change):', tags);
        console.log('📁 Sections extracted:', uniqueSections);
      }
    } catch (err) {
      console.error('❌ Error loading game assets:', err);
      setError('Failed to load game assets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isNovaReady) {
      loadGameAssets();
    }
  }, [isNovaReady, loadGameAssets]);

  // NEW: Always load Firebase assets on mount, regardless of Nova status
  useEffect(() => {
    console.log('🚀 Component mounted - loading Firebase assets immediately');
    loadGameAssets();
  }, []); // Empty dependency array means this runs once on mount

  // NEW: Combined filtering for both section and tag
  const filteredGames = useMemo(() => {
    console.log('🔍 Filtering Firebase games:', { 
      selectedSection, 
      selectedTag,
      firebaseCount: gameAssets.length,
      novaCount: novaAssets.length 
    });
    
    let filtered = [...gameAssets];
    
    // Apply section filter
    if (selectedSection !== 'all') {
      filtered = filtered.filter((g) => g.section === selectedSection);
    }
    
    // Apply tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter((g) => g.tag === selectedTag);
    }
    
    console.log('✅ Filtered Firebase results:', filtered.length);
    return filtered;
  }, [gameAssets, selectedSection, selectedTag]);

  // NEW: Filter Nova assets based on selected tag
  const filteredNovaAssets = useMemo(() => {
    if (selectedTag === 'all') {
      return novaAssets;
    }
    return novaAssets.filter(asset => asset.tag === selectedTag);
  }, [novaAssets, selectedTag]);

  const groupedGames = useMemo(() => {
    let gamesToGroup = gameAssets;
    
    // Apply tag filter to grouped games
    if (selectedTag !== 'all') {
      gamesToGroup = gamesToGroup.filter((g) => g.tag === selectedTag);
    }
    
    return sections.reduce((acc, section) => {
      acc[section] = gamesToGroup.filter((g) => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections, selectedTag]);

  const renderGameContent = () => {
    const hasNovaAssets = filteredNovaAssets.length > 0;
    const hasFirebaseAssets = filteredGames.length > 0;
    
    console.log('🎯 Rendering content:', { 
      hasNovaAssets, 
      hasFirebaseAssets, 
      firebaseCount: filteredGames.length,
      novaCount: filteredNovaAssets.length 
    });
    
    if (!hasNovaAssets && !hasFirebaseAssets) {
      return <SimpleEmptyState selectedSection={selectedSection} selectedTag={selectedTag} colors={colors} />;
    }
    
    const content = [];
    
    // Show Nova Dashboard assets first (if any)
    if (hasNovaAssets) {
      console.log('🎯 Rendering Nova assets:', filteredNovaAssets.length);
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
    
    // Always show Firebase assets if they exist
    if (hasFirebaseAssets) {
      console.log('🎯 Rendering Firebase assets:', filteredGames.length);
      
      if (selectedSection === 'all') {
        // Show all sections
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
        // Show filtered section
        content.push(
          <View key="filtered" style={styles.sectionGroup}>
            <SimpleSectionHeader
              title={`${selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} Assets`}
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
    
    console.log('✅ Final content sections:', content.length);
    return content;
  };

  // Show Nova loading state if Nova is not ready
  if (!isNovaReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: staticColors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={staticColors.background} />
        <LinearGradient colors={[staticColors.backgroundLight, staticColors.background]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} colors={staticColors} />
        <NotificationBanner />
        <NovaLoadingState colors={staticColors} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={[colors.backgroundLight, colors.background]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} colors={colors} />
        <NotificationBanner />
        <SimpleLoadingState colors={colors} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundLight + "CC" }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.backgroundLight + "CC"} />
        <LinearGradient colors={[colors.backgroundLight + "CC", colors.backgroundLight + "CC"]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} colors={colors} />
        <NotificationBanner />
        <SimpleErrorState error={error} onRetry={loadGameAssets} colors={colors} />
      </SafeAreaView>
    );
  }

  return (
          <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundLight + "CC" }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.backgroundLight + "CC"} />
        <LinearGradient colors={[
             // 70% opacity
            colors.backgroundLight + "B3", // 50% opacity
            colors.backgroundLight + "20",
            colors.background + "FF",      // Dark background full opacity
          ]}
          start={{x: 0, y: 0}}    // Top Left
          end={{x: 1, y: 1}}     
            style={StyleSheet.absoluteFill} />

<Header balance={balance} colors={colors} />
        
        <NotificationBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <SimpleGamingHero
          gameCount={gameAssets.length + novaAssets.length}
          selectedSection={selectedSection}
          selectedTag={selectedTag}
          filteredCount={filteredGames.length + filteredNovaAssets.length}
          colors={colors}
        />

        {/* Debug Info - Remove this after fixing */}
      
        {/* NEW: Tags Filter */}
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
          style={[styles.fab, { shadowColor: colors.shadow }]}
          activeOpacity={0.8}
          onPress={() => Linking.openURL('https://t.me/xgamingclub')}
        >
          <LinearGradient colors={[colors.accent, colors.accent]} style={styles.fabGradient}>
            <Text style={[styles.fabText, { color: colors.white }]}>
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

  // NEW: Tags Filter Styles
  tagsContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 10,
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  tagButtonActive: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tagButtonText: {
    fontWeight: '700',
    fontSize: 12,
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
  filterButtonTextActive: {},

  // Game Cards
  gamesList: {
    paddingHorizontal: 20,
  },
  gameCard: {},

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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  
  // NEW: Nova Badge
  novaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  novaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  debugContainer: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'transparent', // Transparent border to allow background color
  },
  debugText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MainScreen;
