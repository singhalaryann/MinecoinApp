// InsufficientBalanceModal.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../screens/theme';
import { Coins, X, Plus } from 'lucide-react-native';

const InsufficientBalance = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleGetCoins = async () => {
    setLoading(true);
    try {
      onClose();
      navigation.navigate('CoinBundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { backgroundColor: colors.background + 'CC', opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { 
              transform: [{ scale: scaleAnim }],
              backgroundColor: colors.card,
              borderColor: colors.border
            }
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: colors.background }]} 
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Icon Container */}
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <Coins size={32} color={colors.accent} />
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Insufficient Balance</Text>
          
          {/* Message */}
          <Text style={[styles.message, { color: colors.text + '80' }]}>
            You don't have enough coins to purchase this item. Get more coins to continue shopping!
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.getCoinsButton, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={handleGetCoins}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Plus size={18} color={colors.white} style={styles.buttonIcon} />
                  <Text style={[styles.getCoinsText, { color: colors.white }]}>Get More Coins</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Maybe Later</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={[styles.infoContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.infoText, { color: colors.text + '60' }]}>
              💡 Tip: Complete quests and vote daily to earn free coins!
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  getCoinsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  getCoinsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InsufficientBalance;