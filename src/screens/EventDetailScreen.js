import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from './theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft } from 'lucide-react-native'; // ADDED: proper back icon
import { useUser } from '../context/UserContext'; // ADDED: for wallet
import { LinearGradient } from 'expo-linear-gradient'; // ADDED: for header gradient

const EventDetailScreen = ({ route }) => {
  const colors = useThemeColors();
  const nav = useNavigation();
  const { user } = useAuth();
  const { balance } = useUser(); // ADDED: for wallet display
  const { event } = route.params || {};

  if (!event) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>Event not found</Text>
      </View>
    );
  }

  const progress = Math.min(1, (event.ticketsSold || 0) / (event.ticketsRequired || 10));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Custom Events Header */}
      <SafeAreaView edges={["top"]} style={[styles.header, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.backgroundLight + "FF", colors.backgroundLight + "80"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => nav.goBack()} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{event.title}</Text>
            
            <TouchableOpacity onPress={() => nav.navigate('CoinBundle')} style={styles.walletButton}>
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

      {event.bannerImageUrl || event.kitImageUrl ? (
        <Image
          source={{ uri: event.bannerImageUrl || event.kitImageUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
      ) : null}

      <Text style={[styles.desc, { color: colors.text + 'B3' }]}>{event.description}</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowText, { color: colors.text }]}>Coins: {event.priceCoins || 0}</Text>
        <Text style={[styles.rowText, { color: colors.text }]}>Status: {event.status || 'upcoming'}</Text>
        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]} />
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {event.ticketsSold || 0}/{event.ticketsRequired || 10} tickets
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.buyBtn, { backgroundColor: colors.accent, shadowColor: colors.shadow }]}
        onPress={() => {
          if (!user) {
            nav.navigate('Profile');
            return;
          }
          nav.navigate('BuyTicket', { eventId: event.id, priceCoins: event.priceCoins || 100 });
        }}
        activeOpacity={0.9}
      >
        <Text style={[styles.buyText, { color: colors.white }]}>Buy Ticket</Text>
        <Text style={[styles.buySub, { color: colors.white + 'CC' }]}>Coins {event.priceCoins || 0}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
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
  banner: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
  desc: { fontSize: 14, marginBottom: 12 },
  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  rowText: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  progressWrap: { height: 10, borderRadius: 6, overflow: 'hidden', marginTop: 6, marginBottom: 6 },
  progressBar: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  progressText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  buyBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
  buyText: { fontSize: 16, fontWeight: '800' },
  buySub: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default EventDetailScreen;


