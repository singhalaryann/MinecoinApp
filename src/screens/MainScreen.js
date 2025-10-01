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
import { useNavigation } from '@react-navigation/native'; // ADDED
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import NotificationBanner from '../components/common/NotificationBanner';
import { fetchGameAssets, fetchGameEvents } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useThemeColors, colors as staticColors } from './theme';
import { useNovaExperience } from 'nova-react-sdk';

// Simple cache key for Nova assets
const NOVA_ASSETS_CACHE_KEY = "nova_assets_cache";

// Default sections that are always available
const DEFAULT_SECTIONS = ['survival', 'lifesteal', 'creative', 'pvp', 'skyblock', 'prison'];

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
const CARD_WIDTH = width - 32;

// ==================== COMPONENTS ====================

// Improved Hero Section with better visual hierarchy
const ModernGamingHero = React.memo(({ gameCount, selectedSection, selectedTag, filteredCount, colors }) => {
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
    <View style={styles.heroContainer}>
      <View style={styles.heroContent}>
        <Text style={[styles.heroTitle, { color: colors.accent }]}>
          Game Assets
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.text }]}>
          {selectedSection === 'all' && selectedTag === 'all'
            ? `${gameCount} premium assets available`
            : `${filteredCount} ${getFilterText()}assets found`
          }
        </Text>
      </View>
      <View style={[styles.heroAccent, { backgroundColor: colors.accent }]} />
    </View>
  );
});

// Modern Tags Filter with improved visual design
const ModernTagsFilter = React.memo(({ tags, selectedTag, onTagChange, colors }) => {
  console.log('🏷️ TagsFilter Render - Available tags:', tags, 'Selected:', selectedTag);
  
  const tagConfigs = {
    all: { emoji: '🎮', name: 'All Assets', color: colors.accent },
    rank: { emoji: '👑', name: 'Ranks', color: colors.accent },
    keys: { emoji: '🔑', name: 'Keys', color: colors.warning },
    companion: { emoji: '🐾', name: 'Companions', color: colors.success },
    asset: { emoji: '💎', name: 'Assets', color: colors.accent + "80" },
  };

  return (
    <View style={styles.tagsContainer}>
      <Text style={[styles.tagsLabel, { color: colors.text }]}>Filter by Type</Text>
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

// Modern Filter Bar with improved spacing and design
const ModernGamingFilter = React.memo(({ sections, selectedSection, onSectionChange, colors }) => {
  const sectionConfigs = {
    survival: { emoji: '🌲', name: 'Survival' },
    lifesteal: { emoji: '⚔️', name: 'Lifesteal' },
    creative: { emoji: '🎨', name: 'Creative' },
    pvp: { emoji: '⚡', name: 'PvP' },
    skyblock: { emoji: '☁️', name: 'Skyblock' },
    prison: { emoji: '🔒', name: 'Prison' },
  };

  return (
    <View style={styles.filterContainer}>
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

// Modern Section Header with improved layout
const ModernSectionHeader = React.memo(({ title, count, colors, isNova = false }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {isNova && (
          <View style={[styles.novaBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.novaBadgeText, { color: colors.white }]}>NOVA</Text>
          </View>
        )}
      </View>
      <View style={[styles.sectionCountBadge, { backgroundColor: colors.accent + '20' }]}>
        <Text style={[styles.sectionCount, { color: colors.accent }]}>
          {count}
        </Text>
      </View>
    </View>
  );
});

// Modern Loading State
const ModernLoadingState = React.memo(({ colors }) => (
  <View style={styles.centeredContainer}>
    <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Loading Assets...
      </Text>
    </View>
  </View>
));

// Modern Error State
const ModernErrorState = React.memo(({ error, onRetry, colors }) => (
  <View style={styles.centeredContainer}>
    <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.errorIcon, { color: colors.error }]}>⚠️</Text>
      <Text style={[styles.errorText, { color: colors.text }]}>
        {error}
      </Text>
      <TouchableOpacity 
        style={[styles.retryButton, { backgroundColor: colors.accent }]} 
        onPress={onRetry}
      >
        <Text style={[styles.retryButtonText, { color: colors.white }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  </View>
));

// Modern Empty State
const ModernEmptyState = React.memo(({ selectedSection, selectedTag, colors }) => {
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
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.emptyIcon, { color: colors.text }]}>📦</Text>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          {getEmptyMessage()}
        </Text>
      </View>
    </View>
  );
});

// ==================== MAIN COMPONENT ====================

const MainScreen = () => {
  const navigation = useNavigation(); // ADDED
  // Get live theme colors from Nova dashboard
  const themeColors = useThemeColors();
  
  // Animation for LIVE badge pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation for LIVE badge
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, [pulseAnim]);
  
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
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay: index * 80,
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
      setSections(DEFAULT_SECTIONS); // Reset to default sections
    }
  }, [isNovaReady]);

  // Force refresh when user state changes (login/logout) - IMMEDIATE CLEAR
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      // IMMEDIATE CLEAR: Clear Nova data instantly on logout
      setNovaAssets([]);
      setSections(DEFAULT_SECTIONS); // Reset to default sections
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
          
          // If Nova has no assets, ensure all Firebase assets have valid sections
          if (novaAssets.length === 0) {
            normalizedAssets.forEach(asset => {
              if (!asset.section || !DEFAULT_SECTIONS.includes(asset.section)) {
                asset.section = 'survival'; // Assign to default section
              }
            });
          }
          
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
  const [sections, setSections] = useState(DEFAULT_SECTIONS); // Initialize with default sections
  const [tags, setTags] = useState(['all', 'asset', 'companion', 'keys', 'rank']); // PERMANENT tags
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all'); // NEW: Selected tag filter
  const [events, setEvents] = useState([]); // NEW: Events data for dynamic banner
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
      // Only update sections if Nova has assets, otherwise keep default sections
      if (combinedNovaAssets.length > 0) {
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
      } else {
        // If Nova has no assets, ensure default sections are preserved
        // This ensures Firebase assets are always displayed with proper section grouping
        setSections(DEFAULT_SECTIONS);
        console.log('🔄 Nova has no assets - using default sections for Firebase assets');
      }
      
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
        section: asset.section || 'survival', // Default to survival if no section
        tag: asset.tag || 'assets', // NEW: Ensure tag field exists
        isNova: false
      }));
      
      // If Nova has no assets, ensure all Firebase assets have valid sections
      if (novaAssets.length === 0) {
        normalizedAssets.forEach(asset => {
          if (!asset.section || !DEFAULT_SECTIONS.includes(asset.section)) {
            asset.section = 'survival'; // Assign to default section
          }
        });
      }
      
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
        
        // Extract unique sections from Firebase assets
        const uniqueSections = [
          ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
        ].sort();
        
        // If Nova has no assets, use Firebase sections or default sections
        if (novaAssets.length === 0) {
          // Use Firebase sections if available, otherwise use default sections
          const finalSections = uniqueSections.length > 0 ? uniqueSections : DEFAULT_SECTIONS;
          setSections(finalSections);
          console.log('🏷️ Using Firebase sections or defaults:', finalSections);
        }
        
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

  // NEW: Fetch events data for dynamic banner
  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log('🎯 Fetching events for dynamic banner...');
        const eventsData = await fetchGameEvents();
        setEvents(eventsData || []);
        console.log('✅ Events loaded:', eventsData?.length || 0, 'events');
      } catch (error) {
        console.error('❌ Failed to load events:', error);
        setEvents([]);
      }
    };
    
    loadEvents();
  }, []); // Run once on mount

  // NEW: Combined filtering for both section and tag
  const filteredGames = useMemo(() => {
    console.log('🔍 Filtering Firebase games:', { 
      selectedSection, 
      selectedTag,
      firebaseCount: gameAssets.length,
      novaCount: novaAssets.length,
      availableSections: sections,
      defaultSections: DEFAULT_SECTIONS
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
  }, [gameAssets, selectedSection, selectedTag, sections]);

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
    
    // Ensure we have sections to group by
    const sectionsToUse = sections.length > 0 ? sections : DEFAULT_SECTIONS;
    
    console.log('📁 Grouping games by sections:', {
      totalGames: gamesToGroup.length,
      availableSections: sectionsToUse,
      sectionsFromState: sections,
      usingDefaultSections: sections.length === 0
    });
    
    const grouped = sectionsToUse.reduce((acc, section) => {
      acc[section] = gamesToGroup.filter((g) => g.section === section);
      return acc;
    }, {});
    
    console.log('✅ Grouped games result:', Object.keys(grouped).map(section => ({
      section,
      count: grouped[section].length
    })));
    
    return grouped;
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
      return <ModernEmptyState selectedSection={selectedSection} selectedTag={selectedTag} colors={colors} />;
    }
    
    const content = [];
    
    // Show Nova Dashboard assets first (if any)
    if (hasNovaAssets) {
      console.log('🎯 Rendering Nova assets:', filteredNovaAssets.length);
      content.push(
        <View key="nova-section" style={styles.sectionGroup}>
          <ModernSectionHeader
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
      
      // Ensure we have sections to work with
      const sectionsToRender = sections.length > 0 ? sections : DEFAULT_SECTIONS;
      
      if (selectedSection === 'all') {
        // Show all sections
        sectionsToRender.forEach((section) => {
          const sectionGames = groupedGames[section];
          if (sectionGames && sectionGames.length > 0) {
            content.push(
              <View key={section} style={styles.sectionGroup}>
                <ModernSectionHeader
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
          }
        });
      } else {
        // Show filtered section
        content.push(
          <View key="filtered" style={styles.sectionGroup}>
            <ModernSectionHeader
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
        <ModernLoadingState colors={staticColors} />
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
        <ModernLoadingState colors={colors} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={[colors.backgroundLight, colors.background]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} colors={colors} />
        <NotificationBanner />
        <ModernErrorState error={error} onRetry={loadGameAssets} colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient 
        colors={[colors.backgroundLight, colors.background]}
        style={StyleSheet.absoluteFill} 
      />
      
      <Header balance={balance} colors={colors} />
      <NotificationBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO BANNER: Enhanced PvP Events with Live Indicators */}
        <TouchableOpacity
          style={styles.heroBannerContainer}
          onPress={() => navigation.navigate('EventsList')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.accent + '20', colors.accent + '10', colors.accent + '05']}
            style={styles.heroBannerGradient}
          >
            {/* Dynamic Live Indicator Badge - Only show when events exist */}
            {events.length > 0 && (
              <Animated.View 
                style={[
                  styles.liveBadge, 
                  { 
                    backgroundColor: colors.error,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                <View style={[styles.livePulse, { backgroundColor: colors.white }]} />
                <Text style={[styles.liveText, { color: colors.white }]}>LIVE</Text>
              </Animated.View>
            )}
            
            {/* Main Content */}
            <View style={styles.heroBannerContent}>
              <View style={styles.heroBannerCenter}>
                <Text style={[styles.heroBannerTitle, { color: colors.accent }]}>
                  ⚡ PvP TOURNAMENTS ⚡
                </Text>
                {events.length > 0 ? (
                  <Text style={[styles.heroBannerSubtitle, { color: colors.text }]}>
                    🏆 {events.length} Active Event{events.length !== 1 ? 's' : ''} Available 🏆
                  </Text>
                ) : (
                  <Text style={[styles.heroBannerSubtitle, { color: colors.text }]}>
                    🏆 Check Back Soon for Tournaments 🏆
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <ModernGamingHero
          gameCount={gameAssets.length + novaAssets.length}
          selectedSection={selectedSection}
          selectedTag={selectedTag}
          filteredCount={filteredGames.length + filteredNovaAssets.length}
          colors={colors}
        />

        <ModernTagsFilter
          tags={tags}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          colors={colors}
        />

        <ModernGamingFilter
          sections={sections}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          colors={colors}
        />

        {renderGameContent()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modern Support FAB */}
      <TouchableOpacity
        style={[styles.fab, { shadowColor: colors.shadow }]}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://t.me/xgamingclub')}
      >
        <LinearGradient colors={[colors.accent, colors.accent + 'CC']} style={styles.fabGradient}>
          <Text style={[styles.fabText, { color: colors.white }]}>
            💬 Support
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
  loadingContainer: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Hero Section
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 5,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 13,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroAccent: {
    width: 80,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },

  // Tags Filter Styles
  tagsContainer: {
    marginBottom: 13,
    paddingHorizontal: 24,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 13,
    opacity: 0.8,
  },
  tagsScrollContent: {
    gap: 10,
  },
  tagButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagButtonActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tagButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },

  // Filter Bar
  filterContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  filterScrollContent: {
    gap: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  filterButtonTextActive: {},

  // Game Cards
  gamesList: {
    paddingHorizontal: 21,
  },
  gameCard: {},

  // Section Headers
  sectionGroup: {
    marginBottom: 40,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 21,
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Nova Badge
  novaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  novaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 21,
    bottom: Platform.OS === 'ios' ? 34 : 24,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  fabText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 40,
  },

  // Hero Banner Styles
  heroBannerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroBannerGradient: {
    padding: 20,
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    // Animation will be handled by CSS or Animated API
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroBannerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroBannerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
    textAlign: 'center',
  },
  heroBannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
    opacity: 0.3,
  },
});

export default MainScreen;
