import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const TransactionList = () => {
  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();
  const colors = useThemeColors();

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Please sign in to view your transactions
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>No transactions yet</Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.accent }]}>Transaction History</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <Animated.View key={transaction.id || index} style={[styles.transactionCard, { 
              backgroundColor: colors.card, 
              shadowColor: colors.shadow,
              borderColor: colors.border,
              borderWidth: 1
            }]}>
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.iconContainer,
                    type === 'purchase' 
                      ? { backgroundColor: colors.error } 
                      : { backgroundColor: colors.success },
                  ]}
                >
                  {type === 'purchase' ? (
                    <MinusCircle size={24} color={colors.white} />
                  ) : (
                    <PlusCircle size={24} color={colors.white} />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.text }]}>{date}</Text>
                </View>
                <Text
                  style={[
                    styles.amount,
                    type === 'purchase' ? { color: colors.error } : { color: colors.accent },
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
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  transactionCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
    minWidth: 90,
    textAlign: 'right',
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TransactionList;