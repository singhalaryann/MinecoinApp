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
      <Text style={[styles.heroTitle, { color: colors.text, textshadowColor: colors.shadow }]}>
        GAME ASSETS
      </Text>
      <Text style={[styles.heroSubtitle, { color: colors.text }]}>
        {selectedSection === 'all' && selectedTag === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${getFilterText()}assets`
        }
      </Text>
      <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
    </View>
  );
});

const TagsFilter = React.memo(({ tags, selectedTag, onTagChange, colors }) => {
  console.log('🏷️ TagsFilter Render - Available tags:', tags, 'Selected:', selectedTag);
  
  const tagConfigs = {
    all: { emoji: '🎮', name: 'All', color: colors.primary },
    rank: { emoji: '👑', name: 'Ranks', color: colors.primary },
    keys: { emoji: '🔑', name: 'Keys', color: colors.keysColor },
    companion: { emoji: '🐾', name: 'Companions', color: colors.companionColor },
    asset: { emoji: '💎', name: 'Asset', color: colors.accent },
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
          const config = tagConfigs[tag] || { emoji: '📦', name: tag, color: colors.primary };
          const isActive = selectedTag === tag;
          
          return (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                { backgroundColor: colors.primary, borderColor: colors.border },
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

const CleanGamingFilter = React.memo(({ sections, selectedSection, onSectionChange, colors }) => {
  const sectionConfigs = {
    survival: { emoji: '🌲', name: 'Survival', color: colors.accent },
    lifesteal: { emoji: '⚔️', name: 'Lifesteal', color: colors.lifestealColor },
    creative: { emoji: '🎨', name: 'Creative', color: colors.warning },
    pvp: { emoji: '⚡', name: 'PvP', color: colors.pvpColor },
    skyblock: { emoji: '☁️', name: 'Skyblock', color: colors.skyblockColor },
    prison: { emoji: '🔒', name: 'Prison', color: colors.prisonColor },
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
            { backgroundColor: colors.primary, borderColor: colors.border },
            selectedSection === 'all' && [styles.filterButtonActive, { 
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              shadowColor: colors.shadow
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
            color: colors.accent,
          };
          const isActive = selectedSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[
                styles.filterButton,
                { backgroundColor: colors.primary, borderColor: colors.border },
                isActive && [styles.filterButtonActive, { 
                  backgroundColor: config.color,
                  borderColor: config.color,
                  shadowColor: config.color 
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

const SimpleSectionHeader = React.memo(({ title, count, colors, isNova = false }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title.toUpperCase()}
        </Text>
        {isNova && (
          <View style={[styles.novaBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.novaBadgeText, { color: colors.text }]}>NOVA</Text>
          </View>
        )}
      </View>
      <Text style={[styles.sectionCount, { color: colors.text }]}>
        {count} Assets
      </Text>
    </View>
  );
});

const SimpleLoadingState = React.memo(({ colors }) => (
  <View style={[styles.centeredContainer, { backgroundColor: colors.backgroundLight }]}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Loading Assets...
    </Text>
    <Text style={[styles.loadingSubtext, { color: colors.text }]}>
      Please wait while we fetch your content
    </Text>
  </View>
));

const NovaLoadingState = React.memo(({ colors }) => (
  <View style={[styles.centeredContainer, { backgroundColor: colors.backgroundLight }]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, { color: colors.text }]}>
      Loading Nova Dashboard...
    </Text>
    <Text style={[styles.loadingSubtext, { color: colors.text }]}>
      Connecting to your personalized experience
    </Text>
  </View>
));

const SimpleErrorState = React.memo(({ error, onRetry, colors }) => (
  <View style={[styles.centeredContainer, { backgroundColor: colors.error }]}>
    <Text style={[styles.errorIcon, { color: colors.text }]}>⚠️</Text>
    <Text style={[styles.errorText, { color: colors.text }]}>
      {error}
    </Text>
    <TouchableOpacity 
      style={[styles.retryButton, { 
        backgroundColor: colors.primary, 
        shadowColor: colors.shadow,
        borderColor: colors.border,
        borderWidth: 1
      }]}
      onPress={onRetry}
    >
      <Text style={[styles.retryButtonText, { color: colors.text }]}>
        🔄 Try Again
      </Text>
    </TouchableOpacity>
  </View>
));

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
    <View style={[styles.centeredContainer, { backgroundColor: colors.backgroundLight, borderRadius: 12, margin: 20, padding: 30 }]}>
      <Text style={[styles.emptyIcon, { color: colors.text }]}>🎮</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Assets Found
      </Text>
      <Text style={[styles.emptyText, { color: colors.text }]}>
        {getEmptyMessage()}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.text }]}>
        Try adjusting your filters or check back later for new content
      </Text>
    </View>
  );
});



const MainScreen = () => {
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  const { isNovaReady } = useAuth();
  
  const { objects, loaded: novaLoaded, error: novaError } = useNovaExperience(isNovaReady ? "home" : null);
  
  useEffect(() => {
    if (!isNovaReady) {
      setNovaAssets([]);
      setSections([]);
    }
  }, [isNovaReady]);

  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      setNovaAssets([]);
      setSections([]);
      setLoading(false);
      
      const clearNovaCache = async () => {
        try {
          await AsyncStorage.removeItem(NOVA_ASSETS_CACHE_KEY);
          console.log("🗑️ Nova cache cleared immediately on logout");
        } catch (error) {
          console.error("❌ Error clearing Nova cache:", error);
        }
      };
      clearNovaCache();
      
      loadGameAssets();
      
      console.log("🚫 User logged out - Nova data cleared immediately, Firebase assets loading");
    } else if (user) {
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const [novaAssets, setNovaAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [tags, setTags] = useState(['all', 'asset', 'companion', 'keys', 'rank']);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const { balance } = useUser();

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
            
            const uniqueSections = [...new Set(cached.map(g => g.section).filter(Boolean))].sort();
            
            setSections(uniqueSections);
            
            console.log("🎯 Using cached Nova assets for instant display");
          }
        }
      } catch (error) {
        console.error("❌ Error checking Nova assets cache:", error);
      }
    };

    checkCachedNovaAssets();
  }, []);

  useEffect(() => {
    if (novaLoaded && objects && user) {
      console.log('🔍 Nova Objects Available:', Object.keys(objects || {}));
      
      const tagSections = ['game-assets'];
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
            
            if (Array.isArray(content)) {
              content.forEach((asset, index) => {
                combinedNovaAssets.push({
                  ...asset,
                  novaSource: sectionKey,
                  isNova: true
                });
              });
            } else {
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
      
      setNovaAssets(prevAssets => {
        const prevAssetsString = JSON.stringify(prevAssets);
        const newAssetsString = JSON.stringify(combinedNovaAssets);
        
        if (prevAssetsString !== newAssetsString) {
          return combinedNovaAssets;
        }
        return prevAssets;
      });
      
      const uniqueSections = [...new Set(combinedNovaAssets.map(g => g.section).filter(Boolean))].sort();
      
      setSections(prevSections => {
        const prevSectionsString = JSON.stringify(prevSections);
        const newSectionsString = JSON.stringify(uniqueSections);
        
        if (prevSectionsString !== newSectionsString) {
          return uniqueSections;
        }
        return prevSections;
      });
      
      console.log('🏷️ Keeping persistent tags:', tags);
    }
  }, [novaLoaded, objects]);

  const loadGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading Firebase game assets...');
      const assets = await fetchGameAssets();
      
      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
        tag: asset.tag || 'assets',
        isNova: false
      }));
      
      console.log('📊 Firebase Assets Loaded:', {
        total: normalizedAssets.length,
        tags: [...new Set(normalizedAssets.map(a => a.tag))],
        sections: [...new Set(normalizedAssets.map(a => a.section))]
      });
      
      if (normalizedAssets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(normalizedAssets);
        
        const uniqueSections = [
          ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
        ].sort();
        setSections(uniqueSections);
        
        console.log('🏷️ Permanent tags (never change):', tags);
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

  const filteredGames = useMemo(() => {
    console.log('🔍 Filtering games:', { 
      selectedSection, 
      selectedTag,
      firebaseCount: gameAssets.length,
      novaCount: novaAssets.length 
    });
    
    let filtered = [...gameAssets];
    
    if (selectedSection !== 'all') {
      filtered = filtered.filter((g) => g.section === selectedSection);
    }
    
    if (selectedTag !== 'all') {
      filtered = filtered.filter((g) => g.tag === selectedTag);
    }
    
    console.log('✅ Filtered results:', filtered.length);
    return filtered;
  }, [gameAssets, selectedSection, selectedTag]);

  const filteredNovaAssets = useMemo(() => {
    if (selectedTag === 'all') {
      return novaAssets;
    }
    return novaAssets.filter(asset => asset.tag === selectedTag);
  }, [novaAssets, selectedTag]);

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

  const renderGameContent = () => {
    const hasNovaAssets = filteredNovaAssets.length > 0;
    const hasFirebaseAssets = filteredGames.length > 0;
    
    if (!hasNovaAssets && !hasFirebaseAssets) {
      return <SimpleEmptyState selectedSection={selectedSection} selectedTag={selectedTag} colors={colors} />;
    }
    
    const content = [];
    
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

  if (!isNovaReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={[colors.background,colors.backgroundLight]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <NovaLoadingState colors={colors} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={[colors.background,colors.backgroundLight]} style={StyleSheet.absoluteFill} />
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
        <LinearGradient colors={[colors.backgroundLight, colors.background]} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleErrorState error={error} onRetry={loadGameAssets} colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient colors={[colors.backgroundLight, colors.background]} style={StyleSheet.absoluteFill} />

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

      <TouchableOpacity
        style={[styles.fab, { shadowColor: colors.primary }]} 
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://t.me/xgamingclub')}
      >
        <LinearGradient colors={[colors.primary, colors.primary]} style={styles.fabGradient}>
          <Text style={[styles.fabText, { color: colors.text }]}>
            SUPPORT
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
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
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },

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

  gamesList: {
    paddingHorizontal: 20,
  },
  gameCard: {},

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
