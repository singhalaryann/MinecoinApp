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
import { colors as staticColors, useThemeColors } from '../../screens/theme';

const SERVER_INFO = {
  ip: 'play.xgaming.club',
  port: '19132',
};

const ServerInfo = ({ visible, onClose }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  const [copiedJava, setCopiedJava] = useState(false);
  const [copiedBedrock, setCopiedBedrock] = useState(false);
  const [scale] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 8,
        speed: 12,
      }).start();
    } else {
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scale]);

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

  const animatedStyle = {
    transform: [{ scale }],
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.container, 
          animatedStyle,
          { 
            backgroundColor: colors.card,
            shadowColor: colors.shadow
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Server Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Java Edition */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Java Edition</Text>
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
                    <Check size={20} color={colors.accent} />
                  ) : (
                    <Copy size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bedrock Edition */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>PE / Bedrock Edition</Text>
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
                    <Check size={20} color={colors.accent} />
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
          <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 12, 12, 0.6)',
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