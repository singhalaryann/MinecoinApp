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
import { colors as staticColors, useThemeColors } from "../../screens/theme";

const DISCORD_URL = "https://discord.gg/a3KmcgCqDP";

const MCVerificationForm = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { updateMcCredentials, loadFirestoreData } = useUser();
  
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
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

  // SuccessModal component - moved inside to access colors
  const SuccessModal = ({ visible, onClose, isUpdating = false }) => (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.accent }]}>
            <Check size={28} color={colors.text} />
          </View>
          <Text style={[styles.modalTitle, { color: colors.accent }]}>
            {isUpdating ? "Update Successful!" : "Verification Successful!"}
          </Text>
          <Text style={[styles.modalDescription, { color: colors.mutedText }]}>
            {isUpdating
              ? "Your Minecraft account has been successfully updated"
              : "Your Minecraft account has been successfully verified"}
          </Text>
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.accent }]} onPress={onClose}>
            <Text style={[styles.modalButtonText, { color: colors.background }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ValidationMessage component - moved inside to access colors
  const ValidationMessage = ({ message, type }) => (
    <View style={[
      styles.validationContainer,
      {
        backgroundColor: colors.card,
        borderColor: colors.accent
      }
    ]}>
      <AlertCircle size={16} color={type === "error" ? colors.error : colors.accent} />
      <Text
        style={[
          styles.validationText,
          type === "error" ? [styles.errorText, { color: colors.error }] : [styles.successText, { color: colors.accent }],
        ]}
      >
        {message}
      </Text>
    </View>
  );

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
      <View style={[
        styles.container, 
        styles.loadingContainer,
        {
          backgroundColor: colors.background,
          borderColor: colors.accent,
          shadowColor: colors.accent
        }
      ]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (formState.uiState.verificationComplete && !formState.uiState.isEditing) {
    return (
      <View style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.accent,
          shadowColor: colors.accent
        }
      ]}>
        <View style={[
          styles.verifiedCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.accent,
            shadowColor: colors.accent
          }
        ]}>
          <View style={[styles.verifiedIcon, { backgroundColor: colors.accent }]}>
            <Check size={28} color={colors.text} />
          </View>
          <Text style={[styles.verifiedTitle, { color: colors.accent }]}>Account Verified</Text>
          <Text style={[styles.verifiedUsername, { color: colors.mutedText }]}>
            {formState.credentials.username}
          </Text>
          <Text style={[styles.verifiedDescription, { color: colors.mutedText }]}>
            Your Minecraft account has been verified and is ready to use
          </Text>
          <View style={[
            styles.rewardsContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.accent
            }
          ]}>
            <View style={styles.rewardsHeader}>
              <Text style={[styles.rewardsTitle, { color: colors.accent }]}>✨ Daily Rewards Activated</Text>
            </View>
            <View style={styles.rewardsInfo}>
              <Text style={[styles.rewardsBenefit, { color: colors.accent }]}>
                🎁 Get 20 free coins daily
              </Text>
              <Text style={[styles.rewardsDescription, { color: colors.mutedText }]}>
                Simply open the app once every 24 hours to claim your reward
                automatically
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.discordButton, { backgroundColor: colors.accent }]}
            onPress={handleDiscordPress}
          >
            <Text style={[styles.discordButtonText, { color: colors.background }]}>Join Our Discord</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.accent }]}
            onPress={() =>
              setFormState((prev) => ({
                ...prev,
                uiState: { ...prev.uiState, isEditing: true },
              }))
            }
          >
            <Text style={[styles.editButtonText, { color: colors.accent }]}>Edit Account Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const editableUsername = !formState.uiState.hasStoredCredentials;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.accent,
          shadowColor: colors.accent
        }
      ]}
    >
      <SuccessModal
        visible={formState.uiState.showSuccess}
        onClose={handleModalClose}
        isUpdating={formState.uiState.isEditing}
      />

      <View style={[
        styles.formContent,
        {
          backgroundColor: colors.background,
          borderColor: colors.accent,
          shadowColor: colors.accent
        }
      ]}>
        <Text style={[styles.title, { color: colors.accent }]}>Minecraft Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          {formState.uiState.isEditing
            ? "Update your account details"
            : "Enter your account details"}
        </Text>

        <View style={styles.formGroup}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.card,
                borderColor: colors.accent
              },
              formState.validation.errors.username && [styles.inputError, { borderColor: colors.error }],
            ]}
          >
            <View style={styles.inputContent}>
              <User size={20} color={colors.accent} />
              <TextInput
                style={[styles.input, { color: colors.accent }]}
                placeholder="Enter your Minecraft gamertag"
                placeholderTextColor={colors.mutedText}
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
                <Lock size={20} color={colors.mutedText} style={styles.lockIcon} />
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
              {
                backgroundColor: colors.card,
                borderColor: colors.accent
              },
              formState.validation.errors.password && [styles.inputError, { borderColor: colors.error }],
            ]}
          >
            <View style={styles.inputContent}>
              <Lock size={20} color={colors.accent} />
              <TextInput
                style={[styles.input, { color: colors.accent }]}
                placeholder="Password used with /register"
                placeholderTextColor={colors.mutedText}
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
                <Text style={[styles.showButtonText, { color: colors.accent }]}>
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
            {
              backgroundColor: colors.accent
            },
            formState.uiState.isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={formState.uiState.isSubmitting}
        >
          <Text style={[styles.submitButtonText, { color: colors.background }]}>
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
    borderRadius: 20,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  formContent: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  formGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  showButton: {
    paddingHorizontal: 8,
  },
  showButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  inputError: {
    // borderColor will be applied dynamically
  },
  verifiedCard: {
    margin: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  verifiedIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  verifiedUsername: {
    fontSize: 18,
    marginBottom: 16,
  },
  verifiedDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  discordButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  discordButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  editButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 320,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  validationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    // color will be applied dynamically
  },
  successText: {
    // color will be applied dynamically
  },
  rewardsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
  },
  rewardsHeader: {
    marginBottom: 8,
    alignItems: "center",
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  rewardsInfo: {
    alignItems: "center",
  },
  rewardsBenefit: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  rewardsDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
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