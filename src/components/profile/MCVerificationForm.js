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
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Check, User, Lock, AlertCircle, ExternalLink, Shield, Settings } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useThemeColors } from "../../screens/theme";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DISCORD_URL = "https://discord.gg/a3KmcgCqDP";

const SuccessModal = ({ visible, onClose, isUpdating = false, colors }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'CC' }]}>
      <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.accent }]}>
          <Check size={28} color={colors.white} />
        </View>
        <Text style={[styles.modalTitle, { color: colors.accent }]}>
          {isUpdating ? "Update Successful!" : "Verification Successful!"}
        </Text>
        <Text style={[styles.modalDescription, { color: colors.text + '80' }]}>
          {isUpdating
            ? "Your Minecraft account has been successfully updated"
            : "Your Minecraft account has been successfully verified"}
        </Text>
        <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.accent }]} onPress={onClose}>
          <Text style={[styles.modalButtonText, { color: colors.white }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ValidationMessage = ({ message, type, colors }) => (
  <View style={styles.validationContainer}>
    <AlertCircle size={16} color={type === "error" ? colors.error : colors.accent} />
    <Text
      style={[
        styles.validationText,
        { color: type === "error" ? colors.error : colors.accent },
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
  const colors = useThemeColors();
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
              verificationComplete: true,
            },
          }));
        }
      } catch (error) {
        console.error("Error checking stored credentials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.email) {
      checkStoredCredentials();
    }
  }, [user?.email]);

  const handleSubmit = async () => {
    const { username, password } = formState.credentials;
    const errors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    }
    if (!password.trim()) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormState((prev) => ({
        ...prev,
        validation: { ...prev.validation, errors },
      }));
      return;
    }

    setFormState((prev) => ({
      ...prev,
      uiState: { ...prev.uiState, isSubmitting: true },
      validation: { errors: {}, messages: {} },
    }));

    try {
      await updateMcCredentials(username.trim(), password);
      setFormState((prev) => ({
        ...prev,
        uiState: {
          ...prev.uiState,
          showSuccess: true,
          isSubmitting: false,
          hasStoredCredentials: true,
          verificationComplete: true,
        },
      }));
      await loadFirestoreData();
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        uiState: { ...prev.uiState, isSubmitting: false },
        validation: {
          ...prev.validation,
          errors: { submit: error.message },
        },
      }));
    }
  };

  const handleEdit = () => {
    setFormState((prev) => ({
      ...prev,
      uiState: { ...prev.uiState, isEditing: true },
      validation: { errors: {}, messages: {} },
    }));
  };

  const handleCancel = () => {
    setFormState((prev) => ({
      ...prev,
      uiState: {
        ...prev.uiState,
        isEditing: false,
        secureTextEntry: true,
      },
      validation: { errors: {}, messages: {} },
    }));
  };

  const handleDiscordJoin = () => {
    Linking.openURL(DISCORD_URL).catch((err) =>
      console.error("Error opening Discord link:", err)
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading verification status...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border,borderWidth: 2,shadowColor: colors.shadow }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent + '20' }]}>
            <Shield size={24} color={colors.accent} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Minecraft Account Verification
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
              Link your Minecraft account to unlock rewards
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        {formState.uiState.hasStoredCredentials && (
          <View style={[styles.statusContainer, { backgroundColor: colors.success + '15', borderColor: colors.success + '90',fontWeight: 'bold' }]}>
            <Check size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success,fontWeight: '1000' }]}>
              Account Verified
            </Text>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <User size={16} color={colors.text + '80'} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Minecraft Username
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background, 
                  borderColor: formState.validation.errors.username ? colors.error + '40' : colors.border + '80',
                  color: colors.text 
                }
              ]}
              value={formState.credentials.username}
              onChangeText={(text) =>
                setFormState((prev) => ({
                  ...prev,
                  credentials: { ...prev.credentials, username: text },
                  validation: { ...prev.validation, errors: { ...prev.validation.errors, username: null } },
                }))
              }
              placeholder="Enter your Minecraft username"
              placeholderTextColor={colors.text + '60'}
              editable={!formState.uiState.hasStoredCredentials}
              autoCapitalize="none"
            />
            {formState.validation.errors.username && (
              <ValidationMessage message={formState.validation.errors.username} type="error" colors={colors} />
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelContainer}>
              <Lock size={16} color={colors.text + '80'} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Minecraft Password
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background, 
                  borderColor: formState.validation.errors.password ? colors.error + '40' : colors.border + '80',
                  color: colors.text 
                }
              ]}
              value={formState.credentials.password}
              onChangeText={(text) =>
                setFormState((prev) => ({
                  ...prev,
                  credentials: { ...prev.credentials, password: text },
                  validation: { ...prev.validation, errors: { ...prev.validation.errors, password: null } },
                }))
              }
              placeholder="Enter your Minecraft password"
              placeholderTextColor={colors.text + '60'}
              secureTextEntry={formState.uiState.secureTextEntry}
              editable={formState.uiState.isEditing || !formState.uiState.hasStoredCredentials}
            />
            {formState.validation.errors.password && (
              <ValidationMessage message={formState.validation.errors.password} type="error" colors={colors} />
            )}
          </View>

          {formState.validation.errors.submit && (
            <ValidationMessage message={formState.validation.errors.submit} type="error" colors={colors} />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {formState.uiState.hasStoredCredentials ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={handleEdit}
                activeOpacity={0.8}
              >
                <Settings size={18} color={colors.white} style={styles.buttonIcon} />
                <Text style={[styles.buttonText, { color: colors.white }]}>
                  Edit Credentials
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.button, 
                styles.primaryButton, 
                { backgroundColor: colors.accent },
                formState.uiState.isSubmitting && { opacity: 0.7 }
              ]}
              onPress={handleSubmit}
              disabled={formState.uiState.isSubmitting}
              activeOpacity={0.8}
            >
              {formState.uiState.isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Check size={18} color={colors.white} style={styles.buttonIcon} />
                  <Text style={[styles.buttonText, { color: colors.white }]}>
                    Verify Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {formState.uiState.isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: colors.border + '100', borderWidth: 1,backgroundColor: colors.card + '80', borderRadius: 5 }]}
              onPress={handleCancel}
              activeOpacity={1}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Discord Link */}
        <TouchableOpacity
          style={[styles.discordButton, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}
          onPress={handleDiscordJoin}
          activeOpacity={0.8}
        >
          <ExternalLink size={18} color={colors.accent} style={styles.discordIcon} />
          <Text style={[styles.discordText, { color: colors.accent }]}>
            Join our Discord for support
          </Text>
        </TouchableOpacity>
      </View>

      <SuccessModal
        visible={formState.uiState.showSuccess}
        onClose={() =>
          setFormState((prev) => ({
            ...prev,
            uiState: { ...prev.uiState, showSuccess: false },
          }))
        }
        isUpdating={formState.uiState.hasStoredCredentials}
        colors={colors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  buttonSection: {
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButton: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginTop: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontWeight: '500',
  },
  discordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  discordIcon: {
    marginRight: 8,
  },
  discordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  validationText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MCVerificationForm;