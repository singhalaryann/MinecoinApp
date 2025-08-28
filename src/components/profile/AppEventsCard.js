import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Alert,
  Dimensions,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useThemeColors } from '../../screens/theme';
import { Gift, Copy, Coins, Sparkles } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Component for each section header
const SectionHeader = ({ title, colors, icon: Icon }) => (
  <View style={styles.sectionHeaderContainer}>
    <Icon size={24} color={colors.accent} style={styles.sectionIcon} />
    <Text style={[styles.title, { color: colors.accent }]}>{title}</Text>
  </View>
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
      <SectionHeader title="Generate Gift Card" colors={colors} icon={Gift} />
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Create gift code (5% tax deducted). Example: 100 → 95
      </Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={giftAmount}
        onChangeText={setGiftAmount}
        keyboardType="number-pad"
        placeholder="Enter amount"
        placeholderTextColor={colors.text + '60'}
        editable={!isGenerating && !isProcessing}
      />

      <TouchableOpacity
        style={[
          styles.actionButton, 
          { backgroundColor: colors.accent }, 
          (isGenerating || isProcessing) && { opacity: 0.7 }
        ]}
        onPress={handleGenerate}
        disabled={isGenerating || isProcessing || !giftAmount}
      >
        <Sparkles size={18} color={colors.white} style={styles.buttonIcon} />
        <Text style={[styles.actionButtonText, { color: colors.white }]}>
          {isGenerating ? 'Generating...' : 'Generate Gift Code'}
        </Text>
      </TouchableOpacity>

      {generatedCode && (
        <View style={[styles.codeContainer, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <View style={styles.codeHeader}>
            <Coins size={16} color={colors.accent} />
            <Text style={[styles.codeLabel, { color: colors.accent }]}>Generated Code</Text>
          </View>
          <Text style={[styles.codeText, { color: colors.text }]}>
            {generatedCode.code}
          </Text>
          <Text style={[styles.codeAmount, { color: colors.text + '80' }]}>
            Amount: {generatedCode.netAmount} coins
          </Text>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: colors.accent }]}
            onPress={() => {
              Clipboard.setString(generatedCode.code);
              Alert.alert('Success', 'Copied to clipboard!');
            }}
          >
            <Copy size={16} color={colors.white} style={styles.copyIcon} />
            <Text style={[styles.copyButtonText, { color: colors.white }]}>Copy Code</Text>
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
      <SectionHeader title="Claim Gift Code" colors={colors} icon={Gift} />
      <Text style={[styles.subtitle, { color: colors.text }]}>Redeem a gift code to add balance</Text>

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={claimCode}
        onChangeText={setClaimCode}
        placeholder="Enter gift code"
        placeholderTextColor={colors.text + '60'}
        autoCapitalize="characters"
        editable={!isClaiming && !isProcessing}
      />

      <TouchableOpacity
        style={[
          styles.actionButton, 
          { backgroundColor: colors.accent }, 
          (isClaiming || isProcessing) && { opacity: 0.7 }
        ]}
        onPress={handleClaim}
        disabled={isClaiming || isProcessing || !claimCode.trim()}
      >
        <Gift size={18} color={colors.white} style={styles.buttonIcon} />
        <Text style={[styles.actionButtonText, { color: colors.white }]}>
          {isClaiming ? 'Claiming...' : 'Claim Gift Code'}
        </Text>
      </TouchableOpacity>

      {claimResult && (
        <View
          style={[
            styles.resultContainer,
            claimResult.success 
              ? { backgroundColor: colors.success + '20', borderColor: colors.success } 
              : { backgroundColor: colors.error + '20', borderColor: colors.error },
          ]}
        >
          <View style={styles.resultHeader}>
            {claimResult.success ? (
              <Sparkles size={20} color={colors.success} />
            ) : (
              <Coins size={20} color={colors.error} />
            )}
            <Text style={[
              styles.resultText, 
              { color: claimResult.success ? colors.success : colors.error }
            ]}>
              {claimResult.success
                ? `Success! ${claimResult.amount} coins added.`
                : `Failed: ${claimResult.message}`}
            </Text>
          </View>
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
      borderColor: colors.border
    }]}>
      {/* Balance Display */}
      <View style={[styles.balanceContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Coins size={24} color={colors.accent} />
        <Text style={[styles.balance, { color: colors.accent }]}>
          {balance.toLocaleString()} coins
        </Text>
      </View>

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
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.3,
  },
  codeContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  codeAmount: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  copyIcon: {
    marginRight: 6,
  },
  copyButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AppEventsCard;