import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { colors } from '../../screens/theme';

// Component for each section header
const SectionHeader = ({ title }) => (
  <Text style={styles.title}>{title}</Text>
);

const GiftCardGenerator = () => {
  const { balance, generateGiftCard, subtractBalance } = useUser();

  const [giftAmount, setGiftAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const amount = parseInt(giftAmount);
    if (!amount || isNaN(amount) || amount < 1) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      setIsProcessing(false);
      return;
    }
    if (amount < 50) {
      Alert.alert('Amount must be 50 or greater than 50 coins !!');
      setIsProcessing(false);
      return;
    }
    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You do not have enough balance');
      setIsProcessing(false);
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateGiftCard(amount);
      await subtractBalance(amount);
      setGeneratedCode(result);
      setGiftAmount('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsGenerating(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="🎁 Generate Gift Card" />
      <Text style={styles.subtitle}>
        Create gift code (5% tax deducted). Example: 100 → 95
      </Text>

      <TextInput
        style={styles.input}
        value={giftAmount}
        onChangeText={setGiftAmount}
        keyboardType="number-pad"
        placeholder="Enter amount"
        placeholderTextColor={colors.mutedText}
        editable={!isGenerating && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isGenerating || isProcessing) && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={isGenerating || isProcessing || !giftAmount}
      >
        <Text style={styles.actionButtonText}>
          {isGenerating ? 'Generating...' : 'Generate Gift Code'}
        </Text>
      </TouchableOpacity>

      {generatedCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>
            Gift Code: {generatedCode.code} (Amount: {generatedCode.netAmount})
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              Clipboard.setString(generatedCode.code);
              Alert.alert('Success', 'Copied to clipboard!');
            }}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const GiftCodeClaimer = ({ addBalance }) => {
  const [claimCode, setClaimCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const { claimGiftCode } = useUser();

  const handleClaim = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!claimCode.trim()) {
      Alert.alert('Invalid Code', 'Please enter a valid gift code');
      setIsProcessing(false);
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimGiftCode(claimCode.trim());
      setClaimResult(result);
      if (result.success) {
        setClaimCode('');
        addBalance(result.amount);
      }
    } catch (error) {
      setClaimResult({ success: false, message: error.message });
    } finally {
      setIsClaiming(false);
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="🎟️ Claim Gift Code" />
      <Text style={styles.subtitle}>Redeem a gift code to add balance</Text>

      <TextInput
        style={styles.input}
        value={claimCode}
        onChangeText={setClaimCode}
        placeholder="Enter gift code"
        placeholderTextColor={colors.mutedText}
        autoCapitalize="characters"
        editable={!isClaiming && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, (isClaiming || isProcessing) && styles.buttonDisabled]}
        onPress={handleClaim}
        disabled={isClaiming || isProcessing || !claimCode.trim()}
      >
        <Text style={styles.actionButtonText}>
          {isClaiming ? 'Claiming...' : 'Claim Gift Code'}
        </Text>
      </TouchableOpacity>

      {claimResult && (
        <View
          style={[
            styles.resultContainer,
            claimResult.success ? styles.successResult : styles.failureResult,
          ]}
        >
          <Text style={styles.resultText}>
            {claimResult.success
              ? `🎉 Success! ${claimResult.amount} added.`
              : `❌ Failed: ${claimResult.message}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const AppEventsCard = () => {
  const { balance, subtractBalance, addBalance, user = {} } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.balance}>Balance: {balance}</Text>

      <GiftCardGenerator
        balance={balance}
        subtractBalance={subtractBalance}
        user={user}
      />

      <View style={styles.divider} />

      <GiftCodeClaimer
        addBalance={addBalance}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Fixed: transparent to show app gradient
    borderRadius: 20,
    padding: 20,
    margin: 16,
    borderWidth: 0, // No borders for consistency
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.accent, // Changed to theme color
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  balance: {
    color: colors.accent, // Changed to theme color
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: colors.mutedText, // Changed to theme color
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    borderRadius: 14,
    padding: 16,
    borderWidth: 0, // No borders for consistency
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  input: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    borderRadius: 10,
    borderWidth: 0, // No borders for consistency
    color: colors.text, // Changed to theme color
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    backgroundColor: colors.accent, // Changed to theme color
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: colors.mutedText, // Changed to theme muted color
  },
  actionButtonText: {
    color: colors.background, // Changed to theme background color for contrast
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent, // Changed to theme color
    marginVertical: 20,
    opacity: 0.4,
  },
  codeContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    padding: 12,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 0, // No borders for consistency
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  codeText: {
    color: colors.accent, // Changed to theme color
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: colors.accent, // Changed to theme color
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  copyButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  successResult: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    borderWidth: 0, // No borders for consistency
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  failureResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Changed to theme error background
    borderWidth: 0, // No borders for consistency
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent, // Changed to theme color
    marginTop: 10,
  },
});

export default AppEventsCard;