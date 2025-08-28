// PaymentSuccessScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, ArrowRight } from 'lucide-react-native';
import { useThemeColors } from './theme';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.navigate('Main');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.contentContainer,
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Success Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
          <Check size={32} color={colors.success} />
        </View>
        
        {/* Success Message */}
        <Text style={[styles.successTitle, { color: colors.text }]}>
          Payment Successful!
        </Text>
        
        <Text style={[styles.successMessage, { color: colors.text + '80' }]}>
          Your purchase has been completed successfully. Enjoy your new assets!
        </Text>
        
        {/* Redirect Message */}
        <View style={styles.redirectContainer}>
          <ArrowRight size={16} color={colors.text + '60'} style={styles.redirectIcon} />
          <Text style={[styles.redirectText, { color: colors.text + '60' }]}>
            Redirecting to home...
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  redirectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redirectIcon: {
    marginRight: 8,
  },
  redirectText: {
    fontSize: 14,
  },
});

export default PaymentSuccessScreen;
