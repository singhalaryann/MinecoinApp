import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Crown, Coins, Settings, LogOut, User, Shield, Gift, Vote, Sword } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { colors as staticColors, useThemeColors } from "./theme";
import MCVerificationForm from "../components/profile/MCVerificationForm";
import TransactionList from "../components/profile/TransactionList";
import UserDetailsForm from "../components/profile/UserDetailsForm";
import GoogleSignInButton from "../components/common/GoogleSignInButton";

const ProfileScreen = () => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle, user } = useAuth();
  const [activeTab, setActiveTab] = useState("MC Verification");

  const tabs = [
    { id: "MC Verification", component: <MCVerificationForm /> },
    { id: "Transactions", component: <TransactionList /> },
    { id: "Events", component: <UserDetailsForm /> },
  ];

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>

        <View style={styles.signInContainer}>
          <Text style={[styles.message, { color: colors.text }]}>Please sign in to continue</Text>
          <GoogleSignInButton onPress={signInWithGoogle} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={[colors.backgroundLight, colors.background]} // Replace with your gradient colors
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.primary }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[
            styles.userInfoCard,
            {
              backgroundColor: colors.backgroundLight,
              shadowColor: colors.shadow,
              borderColor: colors.border
            }
          ]}>
            <View style={styles.userInfoContent}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: colors.primary }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {user?.displayName?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userTextInfo}>
                <Text style={[styles.welcomeText, { color: colors.text }]}>
                  Welcome, {user?.displayName || "User"}
                </Text>
                {user?.email && <Text style={[styles.emailText, { color: colors.text }]}>{user.email}</Text>}
              </View>
            </View>
          </View>

          <View style={[
            styles.tabContainer,
            {
              backgroundColor: colors.backgroundLight,
              borderColor: colors.primary
            }
          ]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab, 
                  activeTab === tab.id && [styles.activeTab, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText, 
                    { color: colors.text },
                    activeTab === tab.id && [styles.activeTabText, { color: colors.text }]
                  ]}
                >
                  {tab.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.content}>
            {tabs.map((tab) => (
              <View key={tab.id} style={{ display: activeTab === tab.id ? "flex" : "none" }}>
                {tab.component}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // Important to keep transparent to show gradient
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  userInfoCard: {
    margin: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  emailText: {
    fontSize: 15,
  },
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 17,
    marginBottom: 24,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    // backgroundColor will be applied dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "700",
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;