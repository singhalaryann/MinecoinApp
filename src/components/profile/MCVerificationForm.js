import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Check, User, Lock, AlertCircle } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { colors } from "../../screens/theme";

const DISCORD_URL = "https://discord.gg/a3KmcgCqDP";

const SuccessModal = ({ visible, onClose, isUpdating = false }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.successIcon}>
          <Check size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.modalTitle}>
          {isUpdating ? "Update Successful!" : "Verification Successful!"}
        </Text>
        <Text style={styles.modalDescription}>
          {isUpdating
            ? "Your Minecraft account has been successfully updated"
            : "Your Minecraft account has been successfully verified"}
        </Text>
        <TouchableOpacity style={styles.modalButton} onPress={onClose}>
          <Text style={styles.modalButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ValidationMessage = ({ message, type }) => (
  <View style={styles.validationContainer}>
    <AlertCircle size={16} color={type === "error" ? "#EF4444" : "#10B981"} />
    <Text
      style={[
        styles.validationText,
        type === "error" ? styles.errorText : styles.successText,
      ]}
    >
      {message}
    </Text>
  </View>
);

const MCVerificationForm = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { updateMcCredentials, loadFirestoreData } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [formState, setFormState] = useState({
    credentials: {
      username: "",
      password: "",
    },
    uiState: {
      isEditing: false,
      showSuccess: false,
      isSubmitting: false,
      secureTextEntry: true,
      hasStoredCredentials: false,
      verificationComplete: false,
    },
    validation: {
      errors: {},
      messages: {},
    },
  });

  useEffect(() => {
    const checkStoredCredentials = async () => {
      setIsLoading(true);
      try {
        const userRef = doc(db, "users", user.email);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists() && userDoc.data().mcUsername) {
          setFormState((prev) => ({
            ...prev,
            credentials: {
              username: userDoc.data().mcUsername,
              password: userDoc.data().mcPassword,
            },
            uiState: {
              ...prev.uiState,
              hasStoredCredentials: true,
              isEditing: false,
              verificationComplete: true,
            },
          }));
        }
      } catch (error) {
        console.error("Error checking credentials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredCredentials();
  }, [user.email]);

  const verifyPlayerCredentials = async (
    username,
    password,
    isEditing = false
  ) => {
    try {
      const playerRef = doc(db, "players", username);
      const playerDoc = await getDoc(playerRef);

      if (isEditing) {
        return playerDoc.exists() ? { id: username, ...playerDoc.data() } : null;
      }

      if (playerDoc.exists() && playerDoc.data().password === password) {
        return { id: username, ...playerDoc.data() };
      }
      return null;
    } catch (error) {
      console.error("Error verifying player:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (formState.uiState.isSubmitting) return;

    setFormState((prev) => ({
      ...prev,
      uiState: { ...prev.uiState, isSubmitting: true },
    }));

    try {
      const { username, password } = formState.credentials;

      const playerData = await verifyPlayerCredentials(
        username.trim(),
        password.trim(),
        formState.uiState.isEditing
      );

      if (!playerData) {
        setFormState((prev) => ({
          ...prev,
          validation: {
            ...prev.validation,
            errors: { submit: "Invalid credentials. Please try again." },
          },
          uiState: { ...prev.uiState, isSubmitting: false },
        }));
        return;
      }

      const success = await updateMcCredentials(
        username.trim(),
        password.trim(),
        playerData.coinBalance || 0
      );

      if (success) {
        setFormState((prev) => ({
          ...prev,
          uiState: {
            ...prev.uiState,
            showSuccess: true,
            hasStoredCredentials: true,
            verificationComplete: true,
            isSubmitting: false,
          },
        }));

        await loadFirestoreData();
      } else {
        setFormState((prev) => ({
          ...prev,
          validation: {
            ...prev.validation,
            errors: { submit: "Update failed. Please try again." },
          },
          uiState: { ...prev.uiState, isSubmitting: false },
        }));
      }
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        validation: {
          ...prev.validation,
          errors: { submit: "An error occurred. Please try again." },
        },
        uiState: { ...prev.uiState, isSubmitting: false },
      }));
    }
  };

  const handleModalClose = () => {
    setFormState((prev) => ({
      ...prev,
      uiState: {
        ...prev.uiState,
        showSuccess: false,
        hasStoredCredentials: true,
        verificationComplete: true,
        isEditing: false,
      },
    }));
  };

  const handleDiscordPress = async () => {
    try {
      await Linking.openURL(DISCORD_URL);
    } catch (error) {
      console.error("Error opening Discord link:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3aed76" />
      </View>
    );
  }

  if (formState.uiState.verificationComplete && !formState.uiState.isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedIcon}>
            <Check size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.verifiedTitle}>Account Verified</Text>
          <Text style={styles.verifiedUsername}>
            {formState.credentials.username}
          </Text>
          <Text style={styles.verifiedDescription}>
            Your Minecraft account has been verified and is ready to use
          </Text>
          <View style={styles.rewardsContainer}>
            <View style={styles.rewardsHeader}>
              <Text style={styles.rewardsTitle}>✨ Daily Rewards Activated</Text>
            </View>
            <View style={styles.rewardsInfo}>
              <Text style={styles.rewardsBenefit}>
                🎁 Get 20 free coins daily 🎁
              </Text>
              <Text style={styles.rewardsDescription}>
                ⏰ Simply open the app once every 24 hours to claim your reward automatically 🚀
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.discordButton}
            onPress={handleDiscordPress}
          >
            <Text style={styles.discordButtonText}>Join Our Discord</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              setFormState((prev) => ({
                ...prev,
                uiState: { ...prev.uiState, isEditing: true },
              }))
            }
          >
            <Text style={styles.editButtonText}>Edit Account Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const editableUsername = !formState.uiState.hasStoredCredentials;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SuccessModal
        visible={formState.uiState.showSuccess}
        onClose={handleModalClose}
        isUpdating={formState.uiState.isEditing}
      />

      <View style={styles.formContent}>
        <Text style={styles.title}>Minecraft Account</Text>
        <Text style={styles.subtitle}>
          {formState.uiState.isEditing
            ? "Update your account details"
            : "Enter your account details"}
        </Text>

        <View style={styles.formGroup}>
          <View
            style={[
              styles.inputWrapper,
              formState.validation.errors.username && styles.inputError,
            ]}
          >
            <View style={styles.inputContent}>
              <User size={20} color="#3aed76" />
              <TextInput
                style={styles.input}
                placeholder="Enter your Minecraft gamertag"
                placeholderTextColor="#6B7280"
                value={formState.credentials.username}
                onChangeText={(text) =>
                  setFormState((prev) => ({
                    ...prev,
                    credentials: { ...prev.credentials, username: text },
                    validation: {
                      ...prev.validation,
                      errors: { ...prev.validation.errors, username: "" },
                    },
                  }))
                }
                editable={editableUsername}
                autoCapitalize="none"
              />
              {!editableUsername && (
                <Lock size={20} color="#9CA3AF" style={styles.lockIcon} />
              )}
            </View>
          </View>

          {formState.validation.errors.username && (
            <ValidationMessage
              message={formState.validation.errors.username}
              type="error"
            />
          )}

          <View
            style={[
              styles.inputWrapper,
              formState.validation.errors.password && styles.inputError,
            ]}
          >
            <View style={styles.inputContent}>
              <Lock size={20} color="#3aed76" />
              <TextInput
                style={styles.input}
                placeholder="Password used with /register"
                placeholderTextColor="#6B7280"
                secureTextEntry={formState.uiState.secureTextEntry}
                value={formState.credentials.password}
                onChangeText={(text) =>
                  setFormState((prev) => ({
                    ...prev,
                    credentials: { ...prev.credentials, password: text },
                    validation: {
                      ...prev.validation,
                      errors: { ...prev.validation.errors, password: "" },
                    },
                  }))
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setFormState((prev) => ({
                    ...prev,
                    uiState: {
                      ...prev.uiState,
                      secureTextEntry: !prev.uiState.secureTextEntry,
                    },
                  }))
                }
                style={styles.showButton}
              >
                <Text style={styles.showButtonText}>
                  {formState.uiState.secureTextEntry ? "Show" : "Hide"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {formState.validation.errors.password && (
            <ValidationMessage
              message={formState.validation.errors.password}
              type="error"
            />
          )}
        </View>

        {formState.validation.errors.submit && (
          <ValidationMessage
            message={formState.validation.errors.submit}
            type="error"
          />
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            formState.uiState.isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={formState.uiState.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formState.uiState.isSubmitting
              ? "Processing..."
              : formState.uiState.isEditing
                ? "Update Account"
                : "Verify Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // Changed to transparent to show gradient
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.accent, // Changed from hardcoded green to theme color
    marginBottom: 10,
    letterSpacing: 1,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.lightText, // Changed to theme color
    marginBottom: 32,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  formGroup: {
    gap: 18,
    marginBottom: 28,
  },
  inputWrapper: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)', // Changed to theme background
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent, // Changed to theme color
    overflow: "hidden",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: colors.text, // Changed to theme color
    padding: 0,
    fontWeight: '500',
  },
  showButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  showButtonText: {
    color: colors.accent, // Changed to theme color
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.accent, // Changed to theme color
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.background, // Changed to theme color
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: colors.error, // Changed to theme error color
  },
  verifiedCard: {
    margin: 24,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderWidth: 0, // Removed border
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Reduced shadow
    shadowRadius: 8,
    elevation: 4, // Reduced elevation
    overflow: 'hidden',
  },
  verifiedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent, // Changed to theme color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  verifiedTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.accent, // Changed to theme color
    marginBottom: 10,
    letterSpacing: 0.5,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  verifiedUsername: {
    fontSize: 20,
    color: colors.text, // Changed to theme color
    marginBottom: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  verifiedDescription: {
    fontSize: 17,
    color: colors.lightText, // Changed to theme color
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  discordButton: {
    backgroundColor: colors.accent, // Changed to theme color
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  discordButtonText: {
    color: colors.background, // Changed to theme color
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  editButton: {
    borderWidth: 0, // Removed border
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    backgroundColor: 'rgba(0, 212, 255, 0.15)', // Slightly more visible background
  },
  editButtonText: {
    color: colors.accent, // Changed to theme color
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 0, // Removed border
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Reduced shadow
    shadowRadius: 8,
    elevation: 4, // Reduced elevation
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent, // Changed to theme color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent, // Changed to theme color
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalDescription: {
    fontSize: 17,
    color: colors.lightText, // Changed to theme color
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 26,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  modalButton: {
    backgroundColor: colors.accent, // Changed to theme color
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalButtonText: {
    color: colors.background, // Changed to theme color
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  validationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 10,
  },
  validationText: {
    fontSize: 15,
    color: colors.lightText, // Changed to theme color
    fontWeight: '500',
  },
  errorText: {
    color: colors.error, // Changed to theme error color
  },
  successText: {
    color: colors.accent, // Changed to theme accent color
  },
  rewardsContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    width: "100%",
    borderWidth: 0,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardsHeader: {
    marginBottom: 12,
    alignItems: "center",
  },
  rewardsTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent,
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rewardsInfo: {
    alignItems: "center",
    gap: 8,
  },
  rewardsBenefit: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rewardsDescription: {
    fontSize: 15,
    color: colors.lightText,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    opacity: 0.5,
  },
});

export default MCVerificationForm;