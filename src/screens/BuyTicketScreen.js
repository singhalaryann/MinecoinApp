import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useThemeColors } from './theme';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deductUserCoins, createTicket, incrementEventTickets, addTransaction } from '../config/firebase';

const BuyTicketScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { eventId, priceCoins = 100 } = route.params || {};
  useEffect(() => {
    if (!user) {
      navigation.navigate('Profile');
    }
  }, [user]);


  const [upiName, setUpiName] = useState('');
  const [discordName, setDiscordName] = useState('');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      if (!user?.email) {
        Alert.alert('Login required', 'Please login to buy a ticket.');
        return;
      }
      if (!eventId) {
        Alert.alert('Error', 'Missing event. Please go back and try again.');
        return;
      }
      if (!upiName || !discordName) {
        Alert.alert('Missing info', 'Please fill UPI name and Discord name.');
        return;
      }

      setLoading(true);

      // Deduct coins
      await deductUserCoins(user.email, priceCoins);

      // Create ticket
      const ticketId = await createTicket(eventId, user.email, { upiName, discordName });

      // Increment event counter
      await incrementEventTickets(eventId);

      // Add transaction
      await addTransaction(user.email, {
        type: 'ticket',
        eventId,
        amountCoins: priceCoins,
        status: 'Paid',
        createdAt: Date.now(),
        ticketId,
      });

      Alert.alert('Success', 'Ticket purchased successfully.');
      navigation.goBack();
    } catch (e) {
      console.error('Buy ticket error', e);
      Alert.alert('Error', 'Could not complete purchase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>Buy Ticket</Text>
          <Text style={[styles.subtitle, { color: colors.text + 'B3' }]}>Coins needed: {priceCoins}</Text>

          <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text + 'B3' }]}>UPI Name</Text>
            <TextInput
              value={upiName}
              onChangeText={setUpiName}
              placeholder="e.g., Aryan Singh"
              placeholderTextColor={colors.text + '66'}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <View style={[styles.field, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text + 'B3' }]}>Discord Name</Text>
            <TextInput
              value={discordName}
              onChangeText={setDiscordName}
              placeholder="e.g., xgaming#1234"
              placeholderTextColor={colors.text + '66'}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            style={[styles.button, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
            activeOpacity={0.9}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>{loading ? 'Processing…' : 'Confirm & Pay'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { fontSize: 14 },
  button: { marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '800' },
});

export default BuyTicketScreen;


