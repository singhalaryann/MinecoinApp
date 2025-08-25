// QuestButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sword } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const QuestButton = ({ style }) => {
  const colors = useThemeColors();
  
  const handleQuestPress = () => {
    // TODO: Implement quest functionality when API is ready
    console.log('Quest button pressed');
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.accent }, style]}
      onPress={handleQuestPress}
      activeOpacity={0.8}
    >
      <Sword size={20} color={colors.white} style={styles.icon} />
      <Text style={[styles.text, { color: colors.white }]}>Quests</Text>
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