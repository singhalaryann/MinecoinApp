// InsufficientBalanceModal.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';
import { Coins, ArrowRight } from 'lucide-react-native';

const InsufficientBalance = ({ visible, onClose }) => {
  const navigation = useNavigation();
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

  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card, shadowColor: colors.shadow }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.backgroundLight }]}>
            <Text style={styles.icon}>💰</Text>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>Insufficient Balance</Text>
          
          <Text style={[styles.message, { color: colors.text }]}>
            You don't have enough coins to purchase this item.
          </Text>

          <TouchableOpacity
            style={[styles.getCoinsButton, loading && styles.buttonDisabled, { 
              backgroundColor: colors.primary,
              shadowColor: colors.shadow
            }]}
            onPress={handleGetCoins}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.getCoinsText, { color: colors.text }]}>Get More Coins</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.backgroundLight }]}
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.6}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  getCoinsButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  getCoinsText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InsufficientBalance;