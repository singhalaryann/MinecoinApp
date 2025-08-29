import { useNovaExperience } from "nova-react-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// Cache configuration - SIMPLIFIED: No TTL, just store theme
const NOVA_THEME_CACHE_KEY = "nova_theme_cache";

// Cache management functions - SIMPLIFIED
// Helper: Deep compare two objects (shallow, but compares color values as strings)
const isThemeEqual = (themeA, themeB) => {
  if (!themeA || !themeB) return false;
  const aKeys = Object.keys(themeA);
  const bKeys = Object.keys(themeB);
  if (aKeys.length !== bKeys.length) return false;
  for (let key of aKeys) {
    // Compare as string, allow any color format (hex, rgb, rgba, etc)
    if (String(themeA[key]) !== String(themeB[key])) return false;
  }
  return true;
};

// Cache theme for user
const cacheNovaTheme = async (theme, userId) => {
  try {
    const cacheData = {
      theme: theme,
      userId: userId,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(NOVA_THEME_CACHE_KEY, JSON.stringify(cacheData));
    console.log("💾 Theme cached/updated successfully:", {
      userId: userId,
      cacheTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Failed to cache theme:", error);
  }
};

// Get cached theme for user, and update if novaTheme is different
// Accepts any color code format (hex, rgb, rgba, etc)
const getCachedNovaTheme = async (userId, novaTheme = null) => {
  try {
    const cachedData = await AsyncStorage.getItem(NOVA_THEME_CACHE_KEY);
    if (!cachedData) {
      console.log("📭 No cached theme found");
      // If novaTheme provided, cache it
      if (novaTheme) {
        await cacheNovaTheme(novaTheme, userId);
        return novaTheme;
      }
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
      // If novaTheme provided, cache it for new user
      if (novaTheme) {
        await cacheNovaTheme(novaTheme, userId);
        return novaTheme;
      }
      return null;
    }

    // If novaTheme provided, compare with cache (allow any color code format)
    if (novaTheme) {
      if (isThemeEqual(cache.theme, novaTheme)) {
        console.log("✅ Nova theme matches cache, using cached theme");
        return cache.theme;
      } else {
        console.log("🔄 Nova theme is different (color values or keys), updating cache and using latest nova theme");
        await cacheNovaTheme(novaTheme, userId);
        return novaTheme;
      }
    }

    // No novaTheme provided, just return cache
    console.log("✅ Valid cached theme found (no novaTheme to compare)");
    return cache.theme;
  } catch (error) {
    console.error("❌ Error reading cached theme:", error);
    return null;
  }
};

// Custom hook to get theme colors from Nova SDK - SIMPLIFIED WITH SIMPLE IF-ELSE
export const useThemeColors = () => {
  const { useStaticTheme } = useAuth();
  const { objects, loaded, error } = useNovaExperience("theme");
  const novaTheme = objects?.["ui-theme"];
  const [cachedTheme, setCachedTheme] = useState(null);
  
  // Check cache on mount for logged in users
  useEffect(() => {
    const checkCache = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.email || "guest";
          
          console.log("🔍 Checking theme cache for logged in user:", userId);
          const cached = await getCachedNovaTheme(userId);
          
          if (cached) {
            setCachedTheme(cached);
            console.log("🎯 Using cached theme for logged in user");
          }
        }
      } catch (error) {
        console.error("❌ Error checking cache:", error);
      }
    };

    checkCache();
  }, []);

  // Cache theme when Nova loads successfully for logged in users
  useEffect(() => {
    const cacheTheme = async () => {
      if (loaded && novaTheme) {
        try {
          const userData = await AsyncStorage.getItem("user");
          const userId = userData ? JSON.parse(userData).email : "guest";
          
          console.log("🔄 Caching theme for logged in user:", userId);
          await cacheNovaTheme(novaTheme, userId);
          setCachedTheme(novaTheme);
        } catch (error) {
          console.error("❌ Error caching theme:", error);
        }
      }
    };

    cacheTheme();
  }, [loaded, novaTheme]);

  // SIMPLE LOGIC: After all hooks are called, determine which theme to use
  if (useStaticTheme) {
    console.log("🎨 Using STATIC colors (user logged out)");
    return colors;
  }

  // User is logged in - use Nova/cache method
  console.log("🎨 Using NOVA/CACHE colors (user logged in)");
  
  // Determine which theme to use for logged in users
  const activeTheme = cachedTheme || novaTheme;
  
  // Check if theme is valid for logged in users with proper null checks
  // Accept any valid color string (hex, rgb, rgba, etc) - validate using regex for color formats
  const isColorString = (val) => {
    if (typeof val !== 'string') return false;
    const s = val.trim();
    // Hex (#fff, #ffffff, #ffffffff)
    if (/^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(s)) return true;
    // rgb(255,255,255) or rgba(255,255,255,1)
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(s)) return true;
    // hsl(0,100%,50%) or hsla(0,100%,50%,1)
    if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/.test(s)) return true;
    // named colors (basic check, can be expanded)
    if (/^[a-zA-Z]+$/.test(s)) return true;
    return false;
  };

  const isThemeValid = activeTheme &&
    (loaded || cachedTheme) &&
    Object.values(activeTheme).some(isColorString) &&
    Object.keys(activeTheme).length > 0;
  if (!isThemeValid) {
    console.log("⚠️ Using static colors - Theme not ready for logged in user");
    return colors;
  }
  
  console.log("🎉 Using Nova/cache colors for logged in user:", activeTheme);
  
  // Return colors object with active theme values or fallbacks
  return {
    // Core colors from Nova
    primary: activeTheme?.primary || '#3B82F6',
    accent: activeTheme?.accent || '#10B981',
    background: activeTheme?.background || '#0A0A0A',
    card: activeTheme?.card || '#111827',
    text: activeTheme?.text || '#F3F4F6',
    border: activeTheme?.border || '#374151',
    shadow: activeTheme?.shadow || '#1E3A8A',
    error: activeTheme?.error || '#EF4444',
    success: activeTheme?.success || '#10B981',
    warning: activeTheme?.warning || '#F59E0B',
    white: activeTheme?.white || '#FFFFFF',
    backgroundLight: activeTheme?.backgroundLight || '#0A0A0A',
  };
};

// Static colors export (fallback/default theme)
export const colors = {
  // Core colors
  primary: '#3B82F6',
  accent: '#10B981',
  background: '#0A0A0A',
  card: '#111827',
  text: '#F3F4F6',
  border: '#374151',
  shadow: '#1E3A8A',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
  backgroundLight: '#0A0A0A',
};