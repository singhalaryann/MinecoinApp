import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import MCVerificationForm from "../components/profile/MCVerificationForm";
import TransactionList from "../components/profile/TransactionList";
import UserDetailsForm from "../components/profile/UserDetailsForm";
import GoogleSignInButton from "../components/common/GoogleSignInButton";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "./theme";
import { Easing } from 'react-native';

// Import LinearGradient from expo-linear-gradient or react-native-linear-gradient
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle, user } = useAuth();
  const [activeTab, setActiveTab] = useState("MC Verification");
  const { width } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    { id: "MC Verification", component: <MCVerificationForm /> },
    { id: "Transactions", component: <TransactionList /> },
    { id: "Events", component: <UserDetailsForm /> },
  ];

useEffect(() => {
  const containerPadding = 6;
  const tabMargin = 2;
  const totalAvailableWidth = width - 40 - (containerPadding * 2); // Container margins + padding
  const singleTabWidth = (totalAvailableWidth - (tabMargin * 6)) / 3; // 3 tabs with 2px margin each side
  const targetPosition = tabs.findIndex(tab => tab.id === activeTab) * (singleTabWidth + (tabMargin * 2)) + containerPadding + tabMargin;

  Animated.timing(slideAnim, {
    toValue: targetPosition,
    duration: 250,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    useNativeDriver: true,
  }).start();
}, [activeTab, width, slideAnim, tabs]);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.signInContainer}>
          <Text style={styles.message}>Please sign in to continue</Text>
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.userInfoCard}>
            <View style={styles.userInfoContent}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.displayName?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userTextInfo}>
                <Text style={styles.welcomeText}>
                  Welcome, {user?.displayName || "User"}
                </Text>
                {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.tabContainer}>
            {/* Sliding Background */}
            <Animated.View
              style={[
                styles.slidingBackground,
                {
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            />
            
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}
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
    borderBottomColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 1,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  userInfoCard: {
    margin: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: colors.accent,
    overflow: 'hidden',
  },
  userInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentGlow,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: 1,
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emailText: {
    fontSize: 16,
    color: colors.lightText,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 18,
    color: colors.lightText,
    marginBottom: 32,
    textAlign: "center",
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 6,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 2,
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accent,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: colors.background,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    marginHorizontal: 20,
  },
slidingBackground: {
  position: 'absolute',
  top: 10,
  left: 5,
  width: '31%', // Better fit for tab content
  height: 44,
  backgroundColor: colors.accent,
  borderRadius: 16,
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
  zIndex: 0,
},
});

export default ProfileScreen;