import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { PlusCircle, MinusCircle, Calendar, Clock } from 'lucide-react-native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

const TransactionList = ({ userId }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  const { transactions } = useUser();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyStateCard}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Please sign in to view your transactions
          </Text>
        </View>
      </View>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
        <View style={styles.emptyStateCard}>
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
    <View style={[styles.container]}>
      <Text style={[styles.heading, { color: colors.text }]}>Transaction History</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {[...transactions].reverse().map((transaction, index) => {
          const { title, amount, date, type } = formatTransaction(transaction);
          return (
            <View key={transaction.id || index} style={[
              styles.transactionCard,
              {
                backgroundColor: colors.card,
                shadowColor: colors.shadow
              }
            ]}>
              <View style={styles.transactionContent}>
                <View
                  style={[
                    styles.iconContainer,
                    type === 'purchase' ? [styles.redIconBg, { backgroundColor: colors.primary }] : [styles.greenIconBg, { backgroundColor: colors.primary }],
                  ]}
                >
                  {type === 'purchase' ? (
                    <MinusCircle size={24} color={colors.error} />
                  ) : (
                    <PlusCircle size={24} color={colors.accent} />
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
                    type === 'purchase' ? [styles.debitAmount, { color: colors.text }] : [styles.creditAmount, { color: colors.text }],
                  ]}
                >
                  {amount} coins
                </Text>
              </View>
            </View>
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
  redIconBg: {
    // backgroundColor will be applied dynamically
  },
  greenIconBg: {
    // backgroundColor will be applied dynamically
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
  debitAmount: {
    // color will be applied dynamically
  },
  creditAmount: {
    // color will be applied dynamically
  },
  emptyStateCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default TransactionList;