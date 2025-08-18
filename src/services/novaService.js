import { useNova } from "nova-react-sdk";

/**
 * Nova Service - Handles real-time sync and user profile management
 * This service provides utility functions for working with Nova SDK
 */

// Hook to get Nova experiences with real-time updates
export const useNovaExperiences = (experienceName) => {
  const { getExperience, state } = useNova();
  
  return {
    getExperience,
    state,
    experiences: state.experiences,
    user: state.user,
    loading: state.loading,
    error: state.error
  };
};

// Hook to get specific Nova experience data
export const useNovaExperience = (experienceName) => {
  const { useNovaExperience } = useNova();
  return useNovaExperience(experienceName);
};

// Utility function to get current user's Nova profile
export const getCurrentNovaProfile = (novaState) => {
  if (!novaState?.user) {
    console.log("No Nova user state available");
    return null;
  }
  
  return {
    externalUserId: novaState.user.userId,
    novaUserId: novaState.user.novaUserId,
    profile: novaState.user.userProfile
  };
};

// Utility function to get experience data by name
export const getExperienceData = (novaState, experienceName) => {
  if (!novaState?.experiences) {
    console.log("No Nova experiences available");
    return null;
  }
  
  const experience = novaState.experiences[experienceName];
  if (!experience) {
    console.log(`Experience '${experienceName}' not found`);
    return null;
  }
  
  return experience;
};

// Utility function to check if user has access to specific experience
export const hasExperienceAccess = (novaState, experienceName) => {
  const experience = getExperienceData(novaState, experienceName);
  return experience !== null;
};

// Utility function to get UI theme data
export const getUITheme = (novaState) => {
  const themeExperience = getExperienceData(novaState, 'theme');
  if (!themeExperience) return null;
  
  return themeExperience.objects?.['ui-theme'];
};

// Utility function to get game sections data
export const getGameSections = (novaState) => {
  const homeExperience = getExperienceData(novaState, 'home');
  if (!homeExperience) return null;
  
  return homeExperience.objects?.['game-sections'];
};

// Utility function to get game assets data
export const getGameAssets = (novaState) => {
  const homeExperience = getExperienceData(novaState, 'home');
  if (!homeExperience) return null;
  
  return homeExperience.objects?.['game-assets'];
};

// Utility function to get app config data
export const getAppConfig = (novaState) => {
  const homeExperience = getExperienceData(novaState, 'home');
  if (!homeExperience) return null;
  
  return homeExperience.objects?.['app-config'];
};

// Utility function to format user profile for Nova
export const formatUserProfileForNova = (userData, firestoreData) => {
  return {
    displayName: userData.displayName,
    hasMcVerified: firestoreData?.hasMcVerified || false,
    coinBalance: firestoreData?.coinBalance || 0,
    mcUsername: firestoreData?.mcUsername || null,
    userType: firestoreData?.hasMcVerified ? 'verified' : 'unverified',
    lastLogin: new Date().toISOString(),
    platform: 'mobile',
    appVersion: '1.0.0',
    // Add any additional profile fields you want to track
    totalGamesPlayed: firestoreData?.totalGamesPlayed || 0,
    joinDate: firestoreData?.joinDate || new Date().toISOString(),
    preferences: firestoreData?.preferences || {}
  };
};

// Utility function to validate Nova configuration
export const validateNovaConfig = (config) => {
  const requiredFields = ['organisationId', 'appId', 'apiEndpoint', 'registry'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error("❌ Missing Nova configuration fields:", missingFields);
    return false;
  }
  
  console.log("✅ Nova configuration is valid");
  return true;
};

// Utility function to log Nova state for debugging
export const logNovaState = (novaState, context = "Current") => {
  console.log(`🔍 ${context} Nova State:`, {
    user: novaState.user ? {
      userId: novaState.user.userId,
      novaUserId: novaState.user.novaUserId,
      profile: novaState.user.userProfile
    } : null,
    experiences: novaState.experiences ? Object.keys(novaState.experiences) : [],
    loading: novaState.loading,
    error: novaState.error,
    timestamp: new Date().toISOString()
  });
};

// Utility function to handle Nova errors gracefully
export const handleNovaError = (error, context = "Nova operation") => {
  console.error(`❌ ${context} failed:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // You can add error reporting logic here
  // For example, send to your analytics service
  
  return {
    success: false,
    error: error.message,
    code: error.code
  };
};

// Export the main useNova hook for direct access
export { useNova } from "nova-react-sdk";
