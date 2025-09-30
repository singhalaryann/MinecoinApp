import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from './theme';
import { fetchGameEvents } from '../config/firebase';
import { ChevronLeft } from 'lucide-react-native'; // ADDED: proper back icon
import { useUser } from '../context/UserContext'; // ADDED: for wallet

const EventsListScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const nav = useNavigation();
  const { balance } = useUser(); // ADDED: for wallet display

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGameEvents();
      const visibleOnly = data.filter(e => e.visible !== false);
      setEvents(visibleOnly);
    } catch (e) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    const sold = item.ticketsSold || 0;
    const req = item.ticketsRequired || 10;
    const progress = Math.min(1, sold / req);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }]}
        onPress={() => navigation.navigate('EventDetail', { event: item })}
        activeOpacity={0.85}
      >
        <View style={styles.rowTop}>
          <Image
            source={{ uri: item.kitImageUrl || item.bannerImageUrl || 'https://via.placeholder.com/80x60' }}
            style={styles.thumb}
            resizeMode="cover"
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: colors.accent + '22' }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>{(item.status || 'upcoming').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.desc, { color: colors.text + 'B3' }]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]} />
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.accent }]} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={[styles.meta, { color: colors.text }]}>{sold}/{req} tickets</Text>
          <View style={styles.ctaRow}>
            <Text style={[styles.meta, { color: colors.text, marginRight: 8 }]}>Coins {item.priceCoins || 0}</Text>
            <LinearGradient colors={[colors.accent, colors.accent + 'CC']} style={styles.viewBtn}>
              <Text style={[styles.viewBtnText, { color: colors.white }]}>View details</Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <Text style={{ color: colors.error }}>{error}</Text>
        <TouchableOpacity onPress={load} style={[styles.retryBtn, { backgroundColor: colors.accent }]}> 
          <Text style={{ color: colors.white, fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
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
            
            <Text style={[styles.headerTitle, { color: colors.text }]}>PvP Events</Text>
            
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
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={(<Text style={{ color: colors.text, textAlign: 'center' }}>No events</Text>)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  listContent: { paddingHorizontal: 16, paddingVertical: 12, width: '100%', maxWidth: 680, alignSelf: 'center' },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: '100%',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 80, height: 60, borderRadius: 8, backgroundColor: '#111', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 13, marginBottom: 10 },
  progressWrap: { height: 8, borderRadius: 6, overflow: 'hidden', marginTop: 2, marginBottom: 8 },
  progressBar: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 12, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  viewBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '800' },
});

export default EventsListScreen;


