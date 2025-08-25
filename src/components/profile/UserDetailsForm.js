import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import CalendarCard from './CalendarCard';
import AppEventsCard from './AppEventsCard';
import { LogOut } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const UserDetailsForm = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const colors = useThemeColors();

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Calendar Section */}
      <View style={[styles.cardContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <CalendarCard />
      </View>

      {/* Daily Questions Section */}
      <View style={[styles.cardContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <AppEventsCard />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error, shadowColor: colors.error }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOut size={22} color={colors.white} style={styles.logoutIcon} />
        <Text style={[styles.logoutText, { color: colors.white }]}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default UserDetailsForm;