import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useThemeColors } from './theme';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { deductUserCoins, createTicket, incrementEventTickets, addTransaction } from '../config/firebase';
import { ChevronLeft } from 'lucide-react-native'; // ADDED: proper back icon
import { useUser } from '../context/UserContext'; // ADDED: for wallet
import { LinearGradient } from 'expo-linear-gradient'; // ADDED: for header gradient

const BuyTicketScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { balance } = useUser(); // ADDED: for wallet display
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
      {/* Custom Events Header */}
      <SafeAreaView edges={["top"]} style={[styles.header, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.backgroundLight + "FF", colors.backgroundLight + "80"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>Buy Ticket</Text>
            
            <TouchableOpacity onPress={() => navigation.navigate('CoinBundle')} style={styles.walletButton}>
              <LinearGradient
                colors={[colors.backgroundLight, colors.background]}
                style={[styles.walletPill, { borderColor: colors.border }]}
              >
                <View style={styles.walletContent}>
                  <Image
                    source={require("../../assets/rupee.png")}
                    style={styles.coinIcon}
                  />
                  <Text style={[styles.walletText, { color: colors.accent }]}>{balance?.toLocaleString() || "0"}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
      
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
  header: { paddingBottom: 0 },
  headerGradient: { paddingHorizontal: 16, paddingVertical: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  walletButton: { borderRadius: 20, overflow: 'hidden' },
  walletPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, minWidth: 80 }, // UPDATED: Better padding, min width for responsiveness
  walletContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, // ADDED: Container for proper alignment
  walletText: { fontSize: 14, fontWeight: '700', marginLeft: 6 }, // UPDATED: Better spacing
  coinIcon: { width: 18, height: 18 }, // UPDATED: Slightly larger icon
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '600' },
  input: { fontSize: 14 },
  button: { marginTop: 8, borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
  buttonText: { fontSize: 16, fontWeight: '800' },
});

export default BuyTicketScreen;


