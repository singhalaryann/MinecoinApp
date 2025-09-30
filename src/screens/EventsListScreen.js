import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from './theme';
import { fetchGameEvents } from '../config/firebase';

const EventsListScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const nav = useNavigation();

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
      {/* Header: back + wallet */}
      <SafeAreaView edges={["top"]} style={[styles.header, { borderColor: colors.border, backgroundColor: colors.background }]}> 
        <View style={styles.headerInner}> 
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>PvP Events</Text>
          <TouchableOpacity onPress={() => nav.navigate('CoinBundle')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 18 }}>💰</Text>
          </TouchableOpacity>
        </View>
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
  header: { borderBottomWidth: 1, paddingVertical: 12 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 16 },
  listContent: { paddingHorizontal: 16, paddingVertical: 12, width: '100%', maxWidth: 680, alignSelf: 'center' },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: '100%',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 80, height: 60, borderRadius: 8, backgroundColor: '#111' },
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
  viewBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewBtnText: { fontSize: 12, fontWeight: '800' },
});

export default EventsListScreen;


