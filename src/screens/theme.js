import { useNovaExperience } from "nova-react-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";

// Cache configuration - SIMPLIFIED: No TTL, just store theme
const NOVA_THEME_CACHE_KEY = "nova_theme_cache";

// Cache management functions - SIMPLIFIED
const cacheNovaTheme = async (theme, userId) => {
  try {
    const cacheData = {
      theme: theme,
      userId: userId,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(NOVA_THEME_CACHE_KEY, JSON.stringify(cacheData));
    console.log("💾 Theme cached successfully:", {
      userId: userId,
      cacheTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Failed to cache theme:", error);
  }
};

const getCachedNovaTheme = async (userId) => {
  try {
    const cachedData = await AsyncStorage.getItem(NOVA_THEME_CACHE_KEY);
    if (!cachedData) {
      console.log("📭 No cached theme found");
      return null;
    }

    const cache = JSON.parse(cachedData);
    const isSameUser = cache.userId === userId;

    console.log("🔍 Cache check:", {
      hasCache: !!cachedData,
      isSameUser,
      cacheUserId: cache.userId,
      currentUserId: userId
    });

    if (!isSameUser) {
      console.log("👤 Different user, removing old cache");
      await AsyncStorage.removeItem(NOVA_THEME_CACHE_KEY);
      return null;
    }

    console.log("✅ Valid cached theme found");
    return cache.theme;
  } catch (error) {
    console.error("❌ Error reading cached theme:", error);
    return null;
  }
};

// Custom hook to get theme colors from Nova SDK - FIXED
export const useThemeColors = () => {
  const { objects, loaded, error } = useNovaExperience("theme");
  const novaTheme = objects?.["ui-theme"];
  const [cachedTheme, setCachedTheme] = useState(null);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  
  // Use ref to track current theme and bypass React state timing issues
  const currentThemeRef = useRef(null);
  const isUsingCacheRef = useRef(false);

  // Check cache on mount
  useEffect(() => {
    const checkCache = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.email || "guest";
          
          console.log("🔍 Checking theme cache for user:", userId);
          const cached = await getCachedNovaTheme(userId);
          
          if (cached) {
            setCachedTheme(cached);
            setIsUsingCache(true);
            currentThemeRef.current = cached;
            isUsingCacheRef.current = true;
            console.log("🎯 Using cached theme for immediate display");
          }
        }
      } catch (error) {
        console.error("❌ Error checking cache:", error);
      }
    };

    checkCache();
  }, []);

  // FIXED: Cache theme when Nova loads successfully and check for changes
  useEffect(() => {
    const cacheTheme = async () => {
      if (loaded && novaTheme) {
        try {
          const userData = await AsyncStorage.getItem("user");
          const userId = userData ? JSON.parse(userData).email : "guest";
          
          console.log("🔄 Checking for theme updates...", {
            hasCachedTheme: !!cachedTheme,
            isUsingCache: isUsingCacheRef.current,
            novaThemeLoaded: !!novaTheme
          });
          
          // FIXED: Check if theme actually changed before caching
          if (cachedTheme && JSON.stringify(cachedTheme) !== JSON.stringify(novaTheme)) {
            console.log("🔄 Theme changed, updating cache for user:", userId);
            await cacheNovaTheme(novaTheme, userId);
            setCachedTheme(novaTheme);
            currentThemeRef.current = novaTheme;
            setIsUsingCache(false);
            isUsingCacheRef.current = false;
            
            // 🚀 FORCE REFRESH: Make app re-render with new theme
            setThemeKey(prev => prev + 1);
            console.log("🔄 Forcing app refresh with new theme!");
            
            // 🚀 IMMEDIATE UPDATE: Force immediate theme change
            console.log("🎨 Theme updated - app should show new colors immediately!");
          } else if (!cachedTheme) {
            // First time loading, cache the theme
            console.log("💾 First time loading, caching theme for user:", userId);
            await cacheNovaTheme(novaTheme, userId);
            setCachedTheme(novaTheme);
            currentThemeRef.current = novaTheme;
            setIsUsingCache(false);
            isUsingCacheRef.current = false;
          } else {
            console.log("✅ Theme unchanged, keeping existing cache");
          }
        } catch (error) {
          console.error("❌ Error caching theme:", error);
        }
      }
    };

    cacheTheme();
  }, [loaded, novaTheme, cachedTheme]);

  // Determine which theme to use - FIXED: Use cache when available
  const activeTheme = isUsingCacheRef.current ? currentThemeRef.current : novaTheme;
  const isFromCache = isUsingCacheRef.current;

  // Enhanced debug logging for theme switching
  useEffect(() => {
    console.log("🔄 Theme source changed:", {
      from: isFromCache ? "CACHE" : "NOVA",
      themeKey: themeKey,
      hasCachedTheme: !!cachedTheme,
      hasNovaTheme: !!novaTheme,
      isUsingCache: isUsingCacheRef.current,
      refValues: {
        currentThemeRef: !!currentThemeRef.current,
        isUsingCacheRef: isUsingCacheRef.current
      }
    });
  }, [isFromCache, themeKey, cachedTheme, novaTheme]);

  // Track active theme changes for debugging
  useEffect(() => {
    if (activeTheme) {
      const primaryColor = activeTheme.primary || 'unknown';
      console.log("🎨 Active theme changed:", {
        primaryColor: primaryColor,
        source: isFromCache ? "CACHE" : "NOVA",
        themeKey: themeKey,
        timestamp: new Date().toISOString()
      });
    }
  }, [activeTheme, isFromCache, themeKey]);

  // Better logging for debugging with emojis
  console.log("🎨 Nova theme status:", { 
    loaded, 
    hasTheme: !!novaTheme, 
    error,
    themeKeys: novaTheme ? Object.keys(novaTheme) : [],
    hasColors: novaTheme ? Object.values(novaTheme).some(val => typeof val === 'string' && val.startsWith('#')) : false,
    themeValues: novaTheme ? Object.values(novaTheme).slice(0, 3) : [],
    isFullyLoaded: loaded && novaTheme && Object.values(novaTheme).some(val => typeof val === 'string' && val.startsWith('#'))
  });

  // NEW: Detailed theme key-value logging
  if (novaTheme) {
    // console.log("🔍 DETAILED NOVA THEME KEY-VALUE PAIRS:");
    // Object.entries(novaTheme).forEach(([key, value]) => {
    //   const valueType = typeof value;
    //   const valuePreview = valueType === 'string' ? value : valueType === 'array' ? `[${Array.isArray(value) ? value.length : 'invalid'} items]` : valueType;
    //   console.log(`  📍 ${key}: ${valuePreview} (${valueType})`);
    // });
    // console.log("🔍 END OF NOVA THEME DETAILS");
  }

  // Cache status logging - FIXED
  console.log("💾 Cache status:", {
    hasCachedTheme: !!cachedTheme,
    isUsingCache: isUsingCacheRef.current,
    activeThemeSource: isFromCache ? "CACHE" : "NOVA",
    activeThemeKeys: activeTheme ? Object.keys(activeTheme).length : 0,
    refStatus: {
      currentThemeRef: !!currentThemeRef.current,
      isUsingCacheRef: isUsingCacheRef.current
    },
    cacheInfo: "No TTL - cache stays until theme changes"
  });
  
  // FIXED: More robust check - ensure theme has actual color values
  const isThemeValid = activeTheme && 
    (isFromCache || loaded) && 
    Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) &&
    Object.keys(activeTheme).length >= 0; // At least 5 theme properties should be loaded
  
  if (!isThemeValid) {
    console.log("⚠️ Using static colors - Theme not ready or invalid");
    console.log("🔍 Theme validation failed:", {
      hasTheme: !!activeTheme,
      loaded,
      isFromCache,
      hasColorValues: activeTheme ? Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) : false,
      themeKeyCount: activeTheme ? Object.keys(activeTheme).length : 0,
      missingRequirements: {
        hasTheme: !!activeTheme,
        isLoaded: loaded || isFromCache,
        hasColors: activeTheme ? Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) : false,
        hasEnoughKeys: activeTheme ? Object.keys(activeTheme).length >= 0 : false
      }
    });
    return colors;
  }
  
  const themeSource = isFromCache ? "CACHED" : "NOVA DASHBOARD";
  console.log(`🎉 Using ${themeSource} colors:`, activeTheme);
  console.log("✅ Theme validation passed - Theme is ready!");
  
  // Return colors object with active theme values or fallbacks
  return {
    // Core Gamer Aesthetic - Blue + Emerald + Magenta Accent
    primary: activeTheme?.primary || '#3B82F6',
   
    
    // Accent - Emerald Green
    accent: activeTheme?.accent || '#10B981',
    
    // Secondary Accent - Gamer Pink
    
    // Backgrounds
    background: activeTheme?.background || '#0A0A0A',
    backgroundLight: activeTheme?.backgroundLight || '#111827',
    card: activeTheme?.card || 'rgba(17, 24, 39, 0.95)',
    
    // Text
    text: activeTheme?.text || '#F3F4F6',
    
    // Borders & Glow
    border: activeTheme?.border || 'rgba(59, 130, 246, 0.2)',
     
    
    // ADDED: Primary gradient for main UI elements
    
    
    // Shadows
    shadow: activeTheme?.shadow || '#1E3A8A',
    fabShadow: activeTheme?.fabShadow || '#10B981',
    
    // ADDED: Primary shadow for main UI elements
    
    // Misc
    
    error: activeTheme?.error || '#EF4444',
    
    // ADDED: Missing colors used throughout the codebase
    // Bright green accent (used extensively)
    
    // Section-specific colors
    keysColor: activeTheme?.keysColor || '#F59E0B',      // Orange for keys section
    companionColor: activeTheme?.companionColor || '#8B5CF6', // Purple for companions
    lifestealColor: activeTheme?.lifestealColor || '#EF4444', // Red for lifesteal
    pvpColor: activeTheme?.pvpColor || '#F59E0B',        // Orange for PVP
    skyblockColor: activeTheme?.skyblockColor || '#8B5CF6',   // Purple for skyblock
    prisonColor: activeTheme?.prisonColor || '#6B7280',       // Gray for prison
    
    // Additional background colors
    
    // White color
    white: activeTheme?.white || '#FFFFFF',
    
    // Additional accent colors
    
    // Success and warning colors
    success: activeTheme?.success || '#10B981',
    warning: activeTheme?.warning || '#F59E0B',
    
    // Additional border colors
    
    // Additional background variations
     
    // Additional text colors
    
    
    // Additional shadow colors
    
  };
};

// Static colors export (fallback/default theme)
export const colors = {
  // Core Gamer Aesthetic - Blue + Emerald + Magenta Accent
  primary: '#3B82F6',
  
  // Accent - Emerald Green
  accent: '#10B981',
  
  // Secondary Accent - Gamer Pink
  
  // Backgrounds
  background: '#0A0A0A',
  backgroundLight: '#111827',
  card: 'rgba(17, 24, 39, 0.95)',
  
  // Text
  text: '#F3F4F6',
  
  // Borders & Glow
  border: 'rgba(59, 130, 246, 0.2)',
  
  // ADDED: Primary glow for main UI elements
  // Shadows
  shadow: '#1E3A8A',
  fabShadow: '#10B981',
  
  // ADDED: Primary shadow for main UI elements
 
  error: '#EF4444',
  
  // ADDED: Missing colors used throughout the codebase
  // Bright green accent (used extensively)
  
  // Section-specific colors
  keysColor: '#F59E0B',      // Orange for keys section
  companionColor: '#8B5CF6', // Purple for companions
  lifestealColor: '#EF4444', // Red for lifesteal
  pvpColor: '#F59E0B',        // Orange for PVP
  skyblockColor: '#8B5CF6',   // Purple for skyblock
  prisonColor: '#6B7280',       // Gray for prison
  
  // Additional background colors
  
  // White color
  white: '#FFFFFF',
  
  // Additional accent colors
  
  // Success and warning colors
  success: '#10B981',
  warning: '#F59E0B',
  
  // Additional border colors
 
};