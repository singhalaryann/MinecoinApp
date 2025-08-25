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
import { useThemeColors } from '../../screens/theme';

// Component for each section header
const SectionHeader = ({ title, colors }) => (
  <Text style={[styles.title, { color: colors.accent }]}>{title}</Text>
);

const GiftCardGenerator = ({ colors }) => {
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
    <View style={[styles.sectionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SectionHeader title="🎁 Generate Gift Card" colors={colors} />
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Create gift code (5% tax deducted). Example: 100 → 95
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        value={giftAmount}
        onChangeText={setGiftAmount}
        keyboardType="number-pad"
        placeholder="Enter amount"
        placeholderTextColor={colors.text}
        editable={!isGenerating && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.accent }, (isGenerating || isProcessing) && { opacity: 0.7 }]}
        onPress={handleGenerate}
        disabled={isGenerating || isProcessing || !giftAmount}
      >
        <Text style={[styles.actionButtonText, { color: colors.white }]}>
          {isGenerating ? 'Generating...' : 'Generate Gift Code'}
        </Text>
      </TouchableOpacity>

      {generatedCode && (
        <View style={[styles.codeContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.accent }]}>
            Gift Code: {generatedCode.code} (Amount: {generatedCode.netAmount})
          </Text>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: colors.accent }]}
            onPress={() => {
              Clipboard.setString(generatedCode.code);
              Alert.alert('Success', 'Copied to clipboard!');
            }}
          >
            <Text style={[styles.copyButtonText, { color: colors.white }]}>Copy</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const GiftCodeClaimer = ({ addBalance, colors }) => {
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
    <View style={[styles.sectionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SectionHeader title="🎟️ Claim Gift Code" colors={colors} />
      <Text style={[styles.subtitle, { color: colors.text }]}>Redeem a gift code to add balance</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
        value={claimCode}
        onChangeText={setClaimCode}
        placeholder="Enter gift code"
        placeholderTextColor={colors.text}
        autoCapitalize="characters"
        editable={!isClaiming && !isProcessing}
      />

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.accent }, (isClaiming || isProcessing) && { opacity: 0.7 }]}
        onPress={handleClaim}
        disabled={isClaiming || isProcessing || !claimCode.trim()}
      >
        <Text style={[styles.actionButtonText, { color: colors.white }]}>
          {isClaiming ? 'Claiming...' : 'Claim Gift Code'}
        </Text>
      </TouchableOpacity>

      {claimResult && (
        <View
          style={[
            styles.resultContainer,
            claimResult.success 
              ? { backgroundColor: colors.success, borderColor: colors.success } 
              : { backgroundColor: colors.error, borderColor: colors.error },
          ]}
        >
          <Text style={[styles.resultText, { color: colors.white }]}>
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
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.card, 
      borderColor: colors.border, 
      shadowColor: colors.shadow 
    }]}>
      <Text style={[styles.balance, { color: colors.accent }]}>Balance: {balance}</Text>

      <GiftCardGenerator
        balance={balance}
        subtractBalance={subtractBalance}
        user={user}
        colors={colors}
      />

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <GiftCodeClaimer
        addBalance={addBalance}
        user={user}
        colors={colors}
      />
    </View>
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionContainer: {
    marginBottom: 24,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.4,
  },
  codeContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 14,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  copyButton: {
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  resultText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
});

export default AppEventsCard;