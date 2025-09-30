import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from './theme';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext'; // ADDED

const EventDetailScreen = ({ route }) => {
  const colors = useThemeColors();
  const nav = useNavigation();
  const { user } = useAuth(); // ADDED
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
      <SafeAreaView edges={["top"]} style={[styles.header, { borderColor: colors.border, backgroundColor: colors.background }]}> 
        <View style={styles.headerInner}> 
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{event.title}</Text>
          <TouchableOpacity onPress={() => nav.navigate('CoinBundle')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 18 }}>💰</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {event.bannerImageUrl || event.kitImageUrl ? (
        <Image
          source={{ uri: event.bannerImageUrl || event.kitImageUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
      ) : null}

      <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
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
  header: { borderBottomWidth: 1, paddingVertical: 12, marginBottom: 8 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16 },
  banner: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 14, marginBottom: 12 },
  card: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 16 },
  rowText: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  progressWrap: { height: 10, borderRadius: 6, overflow: 'hidden', marginTop: 6, marginBottom: 6 },
  progressBar: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  progressText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  buyBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12 },
  buyText: { fontSize: 16, fontWeight: '800' },
  buySub: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default EventDetailScreen;


