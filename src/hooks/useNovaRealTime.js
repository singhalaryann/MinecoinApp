import { useEffect, useState } from 'react';
import { useNova } from 'nova-react-sdk';

/**
 * Custom hook for real-time Nova data with automatic logging
 * This hook provides real-time updates and logs all changes to console
 */
export const useNovaRealTime = (experienceName = null) => {
  const nova = useNova();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Log initial state
  useEffect(() => {
    console.log(`🚀 useNovaRealTime initialized for experience: ${experienceName || 'all'}`);
    console.log('📊 Initial Nova state:', {
      user: nova.state.user,
      experiences: nova.state.experiences ? Object.keys(nova.state.experiences) : [],
      loading: nova.state.loading,
      error: nova.state.error
    });
  }, []);

  // Monitor user changes
  useEffect(() => {
    if (nova.state.user) {
      console.log('👤 Nova user updated:', {
        externalUserId: nova.state.user.userId,
        novaUserId: nova.state.user.novaUserId,
        profile: nova.state.user.userProfile,
        timestamp: new Date().toISOString()
      });
      setLastUpdate(Date.now());
    }
  }, [nova.state.user]);

  // Monitor experience changes
  useEffect(() => {
    if (nova.state.experiences && Object.keys(nova.state.experiences).length > 0) {
      console.log('🎨 Nova experiences updated:', {
        experienceNames: Object.keys(nova.state.experiences),
        timestamp: new Date().toISOString()
      });
      setLastUpdate(Date.now());
    }
  }, [nova.state.experiences]);

  // Monitor loading state
  useEffect(() => {
    if (nova.state.loading) {
      console.log('⏳ Nova loading state changed:', {
        loading: nova.state.loading,
        timestamp: new Date().toISOString()
      });
    }
  }, [nova.state.loading]);

  // Monitor errors
  useEffect(() => {
    if (nova.state.error) {
      console.error('🚨 Nova error detected:', {
        error: nova.state.error,
        timestamp: new Date().toISOString()
      });
    }
  }, [nova.state.error]);

  // Get specific experience data if name is provided
  const getExperienceData = (name) => {
    if (!name) return null;
    return nova.state.experiences?.[name];
  };

  // Get current experience data
  const currentExperience = experienceName ? getExperienceData(experienceName) : null;

  // Log experience data changes
  useEffect(() => {
    if (currentExperience) {
      console.log(`📱 Experience '${experienceName}' data updated:`, {
        experience: currentExperience,
        timestamp: new Date().toISOString()
      });
    }
  }, [currentExperience, experienceName]);

  return {
    // Nova SDK functions
    setUser: nova.setUser,
    loadAllExperiences: nova.loadAllExperiences,
    loadExperience: nova.loadExperience,
    updateUserProfile: nova.updateUserProfile,
    trackEvent: nova.trackEvent,
    
    // State
    user: nova.state.user,
    experiences: nova.state.experiences,
    loading: nova.state.loading,
    error: nova.state.error,
    
    // Current experience data
    currentExperience,
    
    // Utility
    lastUpdate,
    getExperienceData,
    
    // Real-time status
    isConnected: !nova.state.error,
    hasExperiences: nova.state.experiences && Object.keys(nova.state.experiences).length > 0,
    hasUser: !!nova.state.user?.userId
  };
};

export default useNovaRealTime;
