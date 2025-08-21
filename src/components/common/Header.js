import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { Server } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ServerInfo from "./ServerInfo";
import { colors } from "../../screens/theme";

const Header = () => {
  const navigation = useNavigation();
  const { balance, isUpdating } = useUser();
  const { user, isLoggedIn } = useAuth();
  const [showServerInfo, setShowServerInfo] = useState(false);

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
            style={styles.profileGlow}
          >
            {isLoggedIn && user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.initialsContainer}>
                <Text style={styles.initialsText}>{getInitials()}</Text>
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
            style={styles.balancePill}
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
              <Text style={styles.balanceText}>
                {balance?.toLocaleString() || "0"}
              </Text>
            )}
            <View style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
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
            style={styles.serverButtonInner}
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
    paddingBottom: 2,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingBottom: 2,
  },
  profileContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "visible",
    marginRight: 8,
  },
  profileGlow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.accent,
  },
  initialsText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
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
    borderColor: colors.accentGlow,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    color: colors.accent,
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: colors.background,
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
    borderColor: colors.accentGlow,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default Header;