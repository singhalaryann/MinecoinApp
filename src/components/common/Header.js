import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useAuth } from "../../context/AuthContext";
import { Server } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import ServerInfo from "./ServerInfo";
import { useThemeColors } from "../../screens/theme"; // Import the hook instead of static colors

const Header = ({ onProfilePress, onBackPress, title, showBack = false, showProfile = true }) => {
  const { user } = useAuth();
  const { userData } = useUser();
  const { balance = {} } = useUser();
  const navigation = useNavigation();
  const [showServerInfo, setShowServerInfo] = useState(false);
  
  // Get live theme colors from Nova dashboard
  const colors = useThemeColors();
  
  // Safety check - ensure colors are loaded before rendering
  if (!colors) {
    return null; // Don't render until colors are ready
  }

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(" ")[0].charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleServerPress = () => {
    if (!user) {
      navigation.navigate("Profile");
    } else {
      setShowServerInfo(true);
    }
  };

  const isLoggedIn = !!user;
  
  const isUpdating = false; // You can add logic for this if needed

  return (
    
    <LinearGradient
 colors={[
          
          colors.backgroundLight + "FF",
          colors.backgroundLight + "80", // 80% opacity
        ]}
        start={{x: 0, y: 0}}    // Top Left
          end={{x: 1, y: 1}} 
      style={[styles.mainContainer,styles.absoluteFill]}
    >
      <View style={styles.container}>
        {/* Profile */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => navigation.navigate("Profile")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accent, colors.accent + "80"]}
            style={[styles.profileGlow, { shadowColor: colors.shadow }]}
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
            colors={[colors.backgroundLight, colors.background]}
            style={[styles.balancePill, { 
              borderColor: colors.border,
              shadowColor: colors.shadow
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
              shadowColor: colors.shadow
            }]}>
              <Text style={[styles.addButtonText, { color: colors.white }]}>+</Text>
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
            colors={[colors.backgroundLight, colors.background]}
            style={[styles.serverButtonInner, { 
              borderColor: colors.border,
              shadowColor: colors.shadow
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  profileContainer: {
    borderRadius: 21,
    overflow: "hidden",
  },
  profileGlow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
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