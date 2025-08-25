// QuestButton.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';
import { Sword } from 'lucide-react-native';

const QuestButton = ({ onPress, title, isActive = false }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  const handleQuestPress = () => {
    // TODO: Implement quest functionality when API is ready
    console.log('Quest button pressed');
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.accent }]}
      onPress={handleQuestPress}
      activeOpacity={0.8}
    >
      <Sword size={20} color={colors.text} style={styles.icon} />
      <Text style={[styles.text, { color: colors.text }]}>Quests</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuestButton;