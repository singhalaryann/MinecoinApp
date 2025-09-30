import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Clipboard,
  Platform,
  Animated,
} from 'react-native';
import { Copy, Check, X } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const SERVER_INFO = {
  ip: 'play.xgaming.club',
  port: '19132',
};

const ServerInfo = ({ visible, onClose }) => {
  const colors = useThemeColors();
  const [copiedJava, setCopiedJava] = useState(false);
  const [copiedBedrock, setCopiedBedrock] = useState(false);
  // UPDATED: Added internal state to control animation timing
  const [isAnimating, setIsAnimating] = useState(false);
  const [scale] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(0));

  // UPDATED: Professional animation speeds matching modern app standards
  const handleClose = () => {
    setIsAnimating(true);
    // Professional closing animation - smooth but not too slow
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 400, // Professional speed - smooth but responsive
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400, // Professional speed - smooth but responsive
        useNativeDriver: true,
      })
    ]).start(() => {
      // Only call onClose after animation completes
      setIsAnimating(false);
      onClose();
    });
  };

  React.useEffect(() => {
    if (visible) {
      // UPDATED: Professional opening animation - smooth and elegant
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100, // Professional spring tension
          friction: 8,  // Professional spring friction
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350, // Professional opening speed
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, scale, opacity]);

  const handleCopy = async (text, type) => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard.writeText(text);
      } else {
        await Clipboard.setString(text);
      }
      if (type === 'java') {
        setCopiedJava(true);
        setTimeout(() => setCopiedJava(false), 2000);
      } else {
        setCopiedBedrock(true);
        setTimeout(() => setCopiedBedrock(false), 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // UPDATED: Combined scale and opacity animations for smoother effect
  const animatedStyle = {
    transform: [{ scale }],
    opacity: opacity,
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible || isAnimating}
      onRequestClose={handleClose}
    >
      {/* UPDATED: Added animated overlay for smoother background fade effect */}
      <Animated.View style={[styles.overlay, { opacity: opacity }]}>
        <Animated.View style={[styles.container, animatedStyle, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.accent }]}>Server Details</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Java Edition */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Java Edition</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.text }]}>IP Address</Text>
              <View style={styles.copyRow}>
                <Text style={[styles.value, { color: colors.text }]}>{SERVER_INFO.ip}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(SERVER_INFO.ip, 'java')}
                  style={styles.copyBtn}
                  activeOpacity={0.7}
                >
                  {copiedJava ? (
                    <Check size={20} color={colors.success} />
                  ) : (
                    <Copy size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bedrock Edition */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>PE / Bedrock Edition</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.text }]}>IP Address</Text>
              <View style={styles.copyRow}>
                <Text style={[styles.value, { color: colors.text }]}>{SERVER_INFO.ip}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(SERVER_INFO.ip, 'bedrock')}
                  style={styles.copyBtn}
                  activeOpacity={0.7}
                >
                  {copiedBedrock ? (
                    <Check size={20} color={colors.success} />
                  ) : (
                    <Copy size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.text }]}>Port</Text>
              <Text style={[styles.value, { color: colors.text }]}>{SERVER_INFO.port}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.accent }]} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
  },
  section: {
    marginBottom: 28,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copyBtn: {
    padding: 8,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
});

export default ServerInfo;