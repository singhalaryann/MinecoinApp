import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle } from 'lucide-react-native';
import { colors } from '../../screens/theme';

const TransactionList = () => {
  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>
            Please sign in to view your transactions
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      </View>
    );
  }

  const formatTransaction = (transaction) => {
    const title =
      transaction.type === 'purchase'
        ? `Purchase: ${transaction.details?.title || 'Game Asset'}`
        : 'Added Coins';
    const amount =
      transaction.type === 'purchase'
        ? `-${Math.abs(transaction.amount)}`
        : `+${transaction.amount}`;

    let rawDate = transaction.timestamp;
    if (typeof rawDate === 'object' && rawDate?.seconds) {
      rawDate = rawDate.seconds * 1000;
    }
    const date =
      format(new Date(rawDate), 'MMM dd, yyyy') ||
      format(new Date(transaction.timestamp), 'MMM dd, yyyy');

    return { title, amount, date, type: transaction.type };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Transaction History</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <Animated.View key={transaction.id || index} style={styles.transactionCard}>
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.iconContainer,
                    type === 'purchase' ? styles.redIconBg : styles.greenIconBg,
                  ]}
                >
                  {type === 'purchase' ? (
                    <MinusCircle size={24} color="#EF4444" />
                  ) : (
                    <PlusCircle size={24} color="#10B981" />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={styles.transactionTitle} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <Text style={styles.transactionDate}>{date}</Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    type === 'purchase' ? styles.debitAmount : styles.creditAmount,
                  ]}
                >
                  {amount} coins
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Changed to transparent to show gradient
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.accent, // Changed to theme color
    marginBottom: 24,
    marginHorizontal: 16,
    letterSpacing: 0.5,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)', // Changed to theme background
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0, // No borders for consistency
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  redIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', // Changed to theme-consistent red
  },
  greenIconBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)', // Changed to theme-consistent green
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text, // Changed to theme color
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  transactionDate: {
    fontSize: 14,
    color: colors.mutedText, // Changed to theme color
    fontWeight: '500',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
    minWidth: 90,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  debitAmount: {
    color: colors.error, // Changed to theme error color
  },
  creditAmount: {
    color: colors.accent, // Changed to theme accent color
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.mutedText, // Changed to theme color
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TransactionList;