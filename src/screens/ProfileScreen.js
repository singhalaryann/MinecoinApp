import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import MCVerificationForm from "../components/profile/MCVerificationForm";
import TransactionList from "../components/profile/TransactionList";
import UserDetailsForm from "../components/profile/UserDetailsForm";
import GoogleSignInButton from "../components/common/GoogleSignInButton";
import { ArrowLeft } from "lucide-react-native";
import { useThemeColors } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { isLoggedIn, signInWithGoogle, user } = useAuth();
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState("MC Verification");
  
  const tabs = [
    { id: "MC Verification", component: <MCVerificationForm /> },
    { id: "Transactions", component: <TransactionList /> },
    { id: "Events", component: <UserDetailsForm /> },
  ];

  const screenWidth = Dimensions.get('window').width;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tabId) => {
    const newIndex = tabs.findIndex(tab => tab.id === tabId);
    const tabWidth = (screenWidth - 40) / tabs.length;
    
    setActiveTab(tabId);
    
    // Animate tab indicator sliding with smooth easing
    Animated.timing(tabIndicatorAnim, {
      toValue: newIndex * tabWidth,
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Profile</Text>
        </View>

        <View style={styles.signInContainer}>
          <Text style={[styles.message, { color: colors.text }]}>Please sign in to continue</Text>
          <GoogleSignInButton onPress={signInWithGoogle} />
        </View>
      </SafeAreaView>
    );
  }

  const tabWidth = (screenWidth - 40) / tabs.length;

  return (
    <LinearGradient
      colors={[colors.card, colors.background]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.accent }]}>Profile</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.userInfoCard, { backgroundColor: colors.card, shadowColor: colors.shadow, borderColor: colors.border }]}>
            <View style={styles.userInfoContent}>
              <View style={styles.avatarContainer}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={[styles.avatar, { borderColor: colors.accent }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.avatarText, { color: colors.white }]}>
                      {user?.displayName?.charAt(0) || "U"}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userTextInfo}>
                <Text style={[styles.welcomeText, { color: colors.accent }]}>
                  Welcome, {user?.displayName || "User"}
                </Text>
                {user?.email && <Text style={[styles.emailText, { color: colors.text }]}>{user.email}</Text>}
              </View>
            </View>
          </View>

          <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Sliding indicator */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  backgroundColor: colors.accent,
                  width: tabWidth - 8,
                  transform: [{ translateX: tabIndicatorAnim }],
                }
              ]}
            />
            
            {/* Tab buttons */}
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, { width: tabWidth }]}
                onPress={() => handleTabPress(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id 
                      ? { color: colors.white, fontWeight: "700" }
                      : { color: colors.text }
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
    backgroundColor: "transparent",
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
    position: 'relative',
    height: 56,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 46,
    borderRadius: 12,
    zIndex: 0,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;