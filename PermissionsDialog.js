import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from './src/screens/theme';

const PermissionsDialog = ({ visible, onRequestPermissions }) => {
  const colors = useThemeColors();
  
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: `${colors.background}CC` }]}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.accent }]}>Permissions Required</Text>
          <Text style={[styles.message, { color: colors.text }]}>
            This app requires camera, location, microphone, and storage permissions to function properly.
          </Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={onRequestPermissions}>
            <Text style={[styles.buttonText, { color: colors.white }]}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PermissionsDialog;