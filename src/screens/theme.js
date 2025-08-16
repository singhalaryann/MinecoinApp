import { useNovaExperience } from "nova-react-sdk";

// Custom hook to get theme colors from Nova SDK
export const useThemeColors = () => {
  const { objects, loaded } = useNovaExperience("theme"); // UPDATED: Also get loaded status
  const novaTheme = objects?.["ui-theme"];
  
  // UPDATED: Return static colors if Nova not loaded yet
  if (!loaded || !novaTheme) {
    return colors;
  }
  
  // Return colors object with Nova SDK values or fallbacks
  return {
    // Core Gamer Aesthetic - Blue + Emerald + Magenta Accent
    primary: novaTheme?.primary || '#3B82F6',
    primaryDark: novaTheme?.primaryDark || '#1E3A8A',
    primaryLight: novaTheme?.primaryLight || '#93C5FD',
    primaryFaded: novaTheme?.primaryFaded || 'rgba(59, 130, 246, 0.1)',
    
    // Accent - Emerald Green
    accent: novaTheme?.accent || '#10B981',
    accentDark: novaTheme?.accentDark || '#059669',
    accentGlow: novaTheme?.accentGlow || 'rgba(16, 185, 129, 0.25)',
    
    // Secondary Accent - Gamer Pink
    highlight: novaTheme?.highlight || '#EC4899',
    highlightGlow: novaTheme?.highlightGlow || 'rgba(236, 72, 153, 0.2)',
    
    // Backgrounds
    background: novaTheme?.background || '#0A0A0A',
    backgroundLight: novaTheme?.backgroundLight || '#111827',
    card: novaTheme?.card || 'rgba(17, 24, 39, 0.95)',
    
    // Text
    text: novaTheme?.text || '#F3F4F6',
    lightText: novaTheme?.lightText || '#D1D5DB',
    mutedText: novaTheme?.mutedText || '#6B7280',
    
    // Borders & Glow
    border: novaTheme?.border || 'rgba(59, 130, 246, 0.2)',
    borderStrong: novaTheme?.borderStrong || '#3B82F6',
    glow: novaTheme?.glow || 'rgba(59, 130, 246, 0.4)',
    
    // UPDATED: Array colors with safety check to prevent .map errors
    inactiveButton: Array.isArray(novaTheme?.inactiveButton) 
      ? novaTheme.inactiveButton 
      : ['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.02)'],
    
    activeGradient: Array.isArray(novaTheme?.activeGradient)
      ? novaTheme.activeGradient
      : ['#10B981', '#10B981'],
    
    dangerGradient: Array.isArray(novaTheme?.dangerGradient)
      ? novaTheme.dangerGradient
      : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'],
    
    loadingGradient: Array.isArray(novaTheme?.loadingGradient)
      ? novaTheme.loadingGradient
      : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)'],
    
    gradientDark: Array.isArray(novaTheme?.gradientDark)
      ? novaTheme.gradientDark
      : ['#0A0A0A', '#111827', '#0A0A0A'],
    
    // Shadows
    shadow: novaTheme?.shadow || '#1E3A8A',
    fabShadow: novaTheme?.fabShadow || '#10B981',
    
    // Misc
    sectionUnderline: novaTheme?.sectionUnderline || '#93C5FD',
    error: novaTheme?.error || '#EF4444'
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