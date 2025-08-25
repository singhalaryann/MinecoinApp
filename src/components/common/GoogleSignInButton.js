import React from "react";
import { TouchableOpacity, Text, StyleSheet, Image, View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors as staticColors, useThemeColors } from "../../screens/theme";

const GoogleSignInButton = ({ onPress, loading = false, disabled = false }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  const { signInWithGoogle } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { 
          backgroundColor: colors.background,
          shadowColor: colors.shadow
        }
      ]}
      onPress={handleSignIn}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Image
          source={require("../../../assets/google.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={[styles.buttonText, { color: colors.text }]}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default GoogleSignInButton;