import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { Server, ArrowRight, Crown, Coins } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ServerInfo from "./ServerInfo";
import { colors as staticColors, useThemeColors } from "../../screens/theme";

const Header = () => {
  const navigation = useNavigation();
  const { balance, isUpdating } = useUser();
  const { user, isLoggedIn } = useAuth();
  const [showServerInfo, setShowServerInfo] = useState(false);

  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleServerPress = () => {
    if (!isLoggedIn) {
      navigation.navigate("Profile");
    } else {
      setShowServerInfo(true);
    }
  };

  return (
    <LinearGradient
      colors={[colors.backgroundLight, colors.background]}
      style={styles.mainContainer}
    >
      <View style={styles.container}>
        {/* Profile */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accentDark, colors.accent]}
            style={[styles.profileGlow, { 
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 6,
              borderColor: colors.accent
            }]}
          >
            {isLoggedIn && user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={[styles.profileImage, { borderColor: colors.accent }]}
              />
            ) : (
              <View style={[styles.initialsContainer, { 
                backgroundColor: colors.background,
                borderColor: colors.accent
              }]}>
                <Text style={[styles.initialsText, { color: colors.accent }]}>{getInitials()}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Balance */}
        <TouchableOpacity
          style={styles.balanceContainer}
          onPress={() => {
            if (!isLoggedIn) {
              navigation.navigate("Profile");
            } else {
              navigation.navigate("CoinBundle");
            }
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.accentGlow, 'rgba(16,185,129,0.08)']}
            style={[styles.balancePill, { 
              borderColor: colors.accentGlow,
              shadowColor: colors.accent
            }]}
          >
            <Image
              source={require("../../../assets/rupee.png")}
              style={styles.coinIcon}
            />
            {isUpdating ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : (
              <Text style={[styles.balanceText, { color: colors.accent }]}>
                {balance?.toLocaleString() || "0"}
              </Text>
            )}
            <View style={[styles.addButton, { 
              backgroundColor: colors.accent,
              shadowColor: colors.accent
            }]}>
              <Text style={[styles.addButtonText, { color: colors.background }]}>+</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Server Button */}
        <TouchableOpacity
          style={styles.serverButton}
          onPress={handleServerPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accentGlow, 'rgba(16,185,129,0.08)']}
            style={[styles.serverButtonInner, { 
              borderColor: colors.accentGlow,
              shadowColor: colors.accent
            }]}
          >
            <Server size={20} color={colors.accent} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ServerInfo
        visible={showServerInfo}
        onClose={() => setShowServerInfo(false)}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  balanceContainer: {
    marginLeft: "auto",
    marginRight: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 7,
  },
  coinIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  loaderContainer: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
  },
  serverButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 8,
    overflow: "hidden",
  },
  serverButtonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default Header;