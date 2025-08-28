import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import CalendarCard from './CalendarCard';
import AppEventsCard from './AppEventsCard';
import { LogOut, User, Settings } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const UserDetailsForm = () => {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
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
      style={[styles.container]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Profile Header
      <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatarContainer, { backgroundColor: colors.accent }]}>
          <User size={32} color={colors.white} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.displayName || user?.email || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.text }]}>
            {user?.email || 'user@example.com'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: colors.accent + '20' }]}
          onPress={() => console.log('Settings pressed')}
        >
          <Settings size={20} color={colors.accent} />
        </TouchableOpacity>
      </View> */}

      {/* Calendar Section */}
      <View style={[styles.cardContainer]}>
        <CalendarCard />
      </View>

      {/* Daily Questions Section */}
      <View style={[styles.cardContainer]}>
        <AppEventsCard />
      </View>

      {/* Quick Actions
      <View style={[styles.quickActionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.accent }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
            onPress={() => console.log('Vote pressed')}
          >
            <Text style={[styles.quickActionText, { color: colors.accent }]}>Vote</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}
            onPress={() => console.log('Quests pressed')}
          >
            <Text style={[styles.quickActionText, { color: colors.warning }]}>Quests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.success + '15', borderColor: colors.success }]}
            onPress={() => console.log('Support pressed')}
          >
            <Text style={[styles.quickActionText, { color: colors.success }]}>Support</Text>
          </TouchableOpacity>
        </View>
      </View> */}

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error, shadowColor: colors.error }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <LogOut size={20} color={colors.white} style={styles.logoutIcon} />
        <Text style={[styles.logoutText, { color: colors.white }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  quickActionsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default UserDetailsForm;