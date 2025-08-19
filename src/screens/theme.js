import { useNovaExperience } from "nova-react-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";

// Cache configuration - SIMPLIFIED: Just TTL, no version checking
const NOVA_THEME_CACHE_KEY = "nova_theme_cache";
const CACHE_TTL = 25 * 1000; // 25 seconds in milliseconds 

// Cache management functions - SIMPLIFIED
const cacheNovaTheme = async (theme, userId) => {
  try {
    const cacheData = {
      theme: theme,
      userId: userId,
      timestamp: Date.now(),
      ttl: CACHE_TTL
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
    const now = Date.now();
    const isExpired = (now - cache.timestamp) > cache.ttl;
    const isSameUser = cache.userId === userId;

    console.log("🔍 Cache check:", {
      hasCache: !!cachedData,
      isExpired,
      isSameUser,
      cacheAge: Math.round((now - cache.timestamp) / 1000) + " seconds",
      cacheUserId: cache.userId,
      currentUserId: userId
    });

    if (isExpired) {
      console.log("⏰ Cache expired (25 seconds), removing old cache");
      await AsyncStorage.removeItem(NOVA_THEME_CACHE_KEY);
      return null;
    }

    if (!isSameUser) {
      console.log("👤 Different user, removing old cache");
      await AsyncStorage.removeItem(NOVA_THEME_CACHE_KEY);
      return null;
    }

    console.log("✅ Valid cached theme found:", {
      age: Math.round((now - cache.timestamp) / 1000) + " seconds"
    });
    return cache.theme;
  } catch (error) {
    console.error("❌ Error reading cached theme:", error);
    return null;
  }
};

// Custom hook to get theme colors from Nova SDK - SIMPLIFIED
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

  // SIMPLIFIED: Cache theme when Nova loads successfully - no version checking
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
          
          // SIMPLIFIED: Always cache fresh Nova theme if we're not using cache
          if (!isUsingCacheRef.current) {
            console.log("💾 Caching fresh Nova theme for user:", userId);
            await cacheNovaTheme(novaTheme, userId);
          }
          
          // SIMPLIFIED: If we have cached theme, check if it's expired (TTL handles this)
          if (cachedTheme && isUsingCacheRef.current) {
            console.log("🔄 TTL-based update: Checking if cache expired...");
            // TTL will automatically expire cache after 25 seconds
            // Next render will fetch fresh theme
          }
        } catch (error) {
          console.error("❌ Error caching theme:", error);
        }
      }
    };

    cacheTheme();
  }, [loaded, novaTheme]); // Simplified dependencies

  // Determine which theme to use - NOW USING REFS for immediate updates
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

  // Cache status logging
  console.log("💾 Cache status:", {
    hasCachedTheme: !!cachedTheme,
    isUsingCache: isUsingCacheRef.current,
    activeThemeSource: isFromCache ? "CACHE" : "NOVA",
    activeThemeKeys: activeTheme ? Object.keys(activeTheme).length : 0,
    refStatus: {
      currentThemeRef: !!currentThemeRef.current,
      isUsingCacheRef: isUsingCacheRef.current
    },
    ttlInfo: "25 seconds expiry"
  });
  
  // UPDATED: More robust check - ensure theme has actual color values and is fully loaded
  const isThemeValid = activeTheme && 
    (isFromCache || loaded) && 
    Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) &&
    // NEW: Additional check - ensure we have enough color values
    Object.keys(activeTheme).length >= 10; // At least 10 theme properties should be loaded
  
  if (!isThemeValid) {
    console.log("⚠️ Using static colors - Theme not ready or invalid");
    console.log("🔍 Theme validation failed:", {
      hasTheme: !!activeTheme,
      loaded,
      isFromCache,
      hasColorValues: activeTheme ? Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) : false,
      themeKeyCount: activeTheme ? Object.keys(activeTheme).length : 0,
      // NEW: Show what's missing
      missingRequirements: {
        hasTheme: !!activeTheme,
        isLoaded: loaded || isFromCache,
        hasColors: activeTheme ? Object.values(activeTheme).some(val => typeof val === 'string' && val.startsWith('#')) : false,
        hasEnoughKeys: activeTheme ? Object.keys(activeTheme).length >= 10 : false
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
    primaryDark: activeTheme?.primaryDark || '#1E3A8A',
    primaryLight: activeTheme?.primaryLight || '#93C5FD',
    primaryFaded: activeTheme?.primaryFaded || 'rgba(59, 130, 246, 0.1)',
    
    // Accent - Emerald Green
    accent: activeTheme?.accent || '#10B981',
    accentDark: activeTheme?.accentDark || '#059669',
    accentGlow: activeTheme?.accentGlow || 'rgba(16, 185, 129, 0.25)',
    
    // Secondary Accent - Gamer Pink
    highlight: activeTheme?.highlight || '#EC4899',
    highlightGlow: activeTheme?.highlightGlow || 'rgba(236, 72, 153, 0.2)',
    
    // Backgrounds
    background: activeTheme?.background || '#0A0A0A',
    backgroundLight: activeTheme?.backgroundLight || '#111827',
    card: activeTheme?.card || 'rgba(17, 24, 39, 0.95)',
    
    // Text
    text: activeTheme?.text || '#F3F4F6',
    lightText: activeTheme?.lightText || '#D1D5DB',
    mutedText: activeTheme?.mutedText || '#6B7280',
    
    // Borders & Glow
    border: activeTheme?.border || 'rgba(59, 130, 246, 0.2)',
    borderStrong: activeTheme?.borderStrong || '#3B82F6',
    glow: activeTheme?.glow || 'rgba(59, 130, 246, 0.4)',
    
    // UPDATED: Array colors with safety check to prevent .map errors
    inactiveButton: Array.isArray(activeTheme?.inactiveButton) 
      ? activeTheme.inactiveButton 
      : ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
    
    activeGradient: Array.isArray(activeTheme?.activeGradient)
      ? activeTheme.activeGradient
      : ['#10B981', '#10B981'],
    
    dangerGradient: Array.isArray(activeTheme?.dangerGradient)
      ? activeTheme.dangerGradient
      : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'],
    
    loadingGradient: Array.isArray(activeTheme?.loadingGradient)
      ? activeTheme.loadingGradient
      : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)'],
    
    gradientDark: Array.isArray(activeTheme?.gradientDark)
      ? activeTheme.gradientDark
      : ['#0A0A0A', '#111827', '#0A0A0A'],
    
    // Shadows
    shadow: activeTheme?.shadow || '#1E3A8A',
    fabShadow: activeTheme?.fabShadow || '#10B981',
    
    // Misc
    sectionUnderline: activeTheme?.sectionUnderline || '#93C5FD',
    error: activeTheme?.error || '#EF4444'
  };
};

// Static colors export (fallback/default theme)
export const colors = {
  // Core Gamer Aesthetic - Blue + Emerald + Magenta Accent
  primary: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryLight: '#93C5FD',
  primaryFaded: 'rgba(59, 130, 246, 0.1)',
  
  // Accent - Emerald Green
  accent: '#10B981',
  accentDark: '#059669',
  accentGlow: 'rgba(16, 185, 129, 0.25)',
  
  // Secondary Accent - Gamer Pink
  highlight: '#EC4899',
  highlightGlow: 'rgba(236, 72, 153, 0.2)',
  
  // Backgrounds
  background: '#0A0A0A',
  backgroundLight: '#111827',
  card: 'rgba(17, 24, 39, 0.95)',
  
  // Text
  text: '#F3F4F6',
  lightText: '#D1D5DB',
  mutedText: '#6B7280',
  
  // Borders & Glow
  border: 'rgba(59, 130, 246, 0.2)',
  borderStrong: '#3B82F6',
  glow: 'rgba(59, 130, 246, 0.4)',
  
  // Buttons - Arrays for gradients
  inactiveButton: ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
  activeGradient: ['#10B981', '#10B981'],
  dangerGradient: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'],
  loadingGradient: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)'],
  
  // Shadows
  shadow: '#1E3A8A',
  fabShadow: '#10B981',
  
  // Misc
  gradientDark: ['#0A0A0A', '#111827', '#0A0A0A'],
  sectionUnderline: '#93C5FD',
  error: '#EF4444'
};