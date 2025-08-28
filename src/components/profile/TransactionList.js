import React from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Dimensions } from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle, DollarSign, Clock } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TransactionList = () => {
  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();
  const colors = useThemeColors();

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyStateIcon, { backgroundColor: colors.accent + '20' }]}>
            <DollarSign size={32} color={colors.accent} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            Sign In Required
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
            Please sign in to view your transaction history
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyStateIcon, { backgroundColor: colors.accent + '20' }]}>
            <Clock size={32} color={colors.accent} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No Transactions Yet
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.text + '80' }]}>
            Your transaction history will appear here once you make your first transaction
          </Text>
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
    <View style={[styles.container]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.heading, { color: colors.accent }]}>Transaction History</Text>
        <Text style={[styles.subtitle, { color: colors.text + '80' }]}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <Animated.View 
              key={transaction.id || index} 
              style={[
                styles.transactionCard, 
                { 
                  backgroundColor: colors.card, 
                  shadowColor: colors.shadow,
                  borderColor: colors.border,
                }
              ]}
            >
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.iconContainer,
                    type === 'purchase' 
                      ? { backgroundColor: colors.error + '20' } 
                      : { backgroundColor: colors.success + '20' },
                  ]}
                >
                  {type === 'purchase' ? (
                    <MinusCircle size={20} color={colors.error} />
                  ) : (
                    <PlusCircle size={20} color={colors.success} />
                  )}
                </View>
                <View style={styles.detailsContainer}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.text + '70' }]}>
                    {date}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text
                    style={[
                      styles.amount,
                      type === 'purchase' ? { color: colors.error } : { color: colors.success },
                    ]}
                  >
                    {amount}
                  </Text>
                  <Text style={[styles.currency, { color: colors.text + '60' }]}>coins</Text>
                </View>
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  transactionCard: {
    borderRadius: 16,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  currency: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    borderRadius: 20,
    borderWidth: 1,
    margin: 20,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TransactionList;