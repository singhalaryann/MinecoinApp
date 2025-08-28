// QuestButton.js
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View, Dimensions } from 'react-native';
import { Sword, X, Star, Target, Award } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QuestButton = ({ style }) => {
  const colors = useThemeColors();
  const [showModal, setShowModal] = useState(false);
  
  const handleQuestPress = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.accent }, style]}
        onPress={handleQuestPress}
        activeOpacity={0.8}
      >
        <Sword size={18} color={colors.white} style={styles.icon} />
        <Text style={[styles.text, { color: colors.white }]}>Quests</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: colors.accent + '20' }]}>
                <Sword size={24} color={colors.accent} />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={20} color={colors.text + '80'} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Daily Quests
            </Text>
            <Text style={[styles.modalDescription, { color: colors.text + '80' }]}>
              Complete quests to earn rewards and progress in your gaming journey.
            </Text>

            <View style={styles.questsContainer}>
              {/* Sample Quest Items */}
              <View style={[styles.questItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.questIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Target size={20} color={colors.accent} />
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, { color: colors.text }]}>
                    Win 5 Games
                  </Text>
                  <Text style={[styles.questDescription, { color: colors.text + '80' }]}>
                    Win 5 games to earn 100 coins
                  </Text>
                  <View style={styles.questProgress}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.accent, width: '60%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text + '80' }]}>
                      3/5 completed
                    </Text>
                  </View>
                </View>
                <View style={[styles.rewardIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Award size={16} color={colors.warning} />
                </View>
              </View>

              <View style={[styles.questItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.questIcon, { backgroundColor: colors.success + '20' }]}>
                  <Star size={20} color={colors.success} />
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, { color: colors.text }]}>
                    Vote for Server
                  </Text>
                  <Text style={[styles.questDescription, { color: colors.text + '80' }]}>
                    Vote daily to earn 50 coins
                  </Text>
                  <View style={styles.questProgress}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.success, width: '100%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.success }]}>
                      Completed!
                    </Text>
                  </View>
                </View>
                <View style={[styles.rewardIcon, { backgroundColor: colors.success + '20' }]}>
                  <Award size={16} color={colors.success} />
                </View>
              </View>

              <View style={[styles.questItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.questIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Target size={20} color={colors.warning} />
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, { color: colors.text }]}>
                    Play 10 Games
                  </Text>
                  <Text style={[styles.questDescription, { color: colors.text + '80' }]}>
                    Play 10 games to earn 75 coins
                  </Text>
                  <View style={styles.questProgress}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.warning, width: '20%' }]} />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text + '80' }]}>
                      2/10 completed
                    </Text>
                  </View>
                </View>
                <View style={[styles.rewardIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Award size={16} color={colors.warning} />
                </View>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={[styles.statItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.statValue, { color: colors.accent }]}>12</Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Total Quests</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.statValue, { color: colors.success }]}>8</Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Completed</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.background }]}>
                <Text style={[styles.statValue, { color: colors.warning }]}>1,250</Text>
                <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Coins Earned</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: colors.accent }]}
              onPress={closeModal}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeModalButtonText, { color: colors.white }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  questsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  questIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  questProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  closeModalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuestButton;