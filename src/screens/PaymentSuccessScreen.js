// PaymentSuccessScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from './theme';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Main');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
        <Check size={32} color={colors.white} />
      </View>
      <Text style={[styles.successText, { color: colors.success }]}>Payment Successful!</Text>
      <Text style={[styles.redirectText, { color: colors.text }]}>Redirecting to home...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  redirectText: {
    fontSize: 16,
    letterSpacing: 0.25,
  },
});

export default PaymentSuccessScreen;
