// NotificationBanner.js - Shows notifications at the top of the screen
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
// Import Firebase database connection and needed functions
import { db } from '../../config/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { colors as staticColors, useThemeColors } from '../../screens/theme';

const NotificationBanner = () => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  // Store the notification message
  const [notification, setNotification] = useState(null);
  // Create animation value for fade effect (0 = invisible, 1 = visible)
  const [opacity] = useState(new Animated.Value(0));

  // Function to fade in the notification
  const fadeIn = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,         // Fade to fully visible
      duration: 300,      // Take 300 milliseconds
      useNativeDriver: true,  // Use native animation
    }).start();
  }, [opacity]);

  // Function to fade out the notification
  const fadeOut = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,         // Fade to invisible
      duration: 300,      // Take 300 milliseconds
      useNativeDriver: true,
    }).start(() => setNotification(null));  // Clear message after fade
  }, [opacity]);

  // Set up connection to Firebase when component starts
  useEffect(() => {
    try {
      // Connect to the bannerNotifications collection in Firebase
      const notificationsRef = collection(db, 'bannerNotifications');
      
      // Create a query to get the newest notification
      const q = query(
        notificationsRef,
        orderBy('timestamp', 'desc'),  // Sort by newest first
        limit(1)                       // Get only 1 notification
      );

      // Listen for real-time updates to notifications
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          // Get the notification data
          const notificationData = snapshot.docs[0].data();
          
          // If notification is marked as active, show it
          if (notificationData.isActive) {
            setNotification(notificationData.text);
            fadeIn();
          } else {
            // If not active, hide it
            fadeOut();
          }
        } else {
          // If no notifications exist, ensure banner is hidden
          fadeOut();
        }
      }, (error) => {
        console.error('Error fetching notifications:', error);
        fadeOut();
      });

      // Clean up listener when component unmounts
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up notification listener:', error);
    }
  }, [fadeIn, fadeOut]);

  // Don't show anything if there's no notification
  if (!notification) return null;

  // Render the notification banner
  return (
    <Animated.View style={[
      styles.container, 
      { 
        opacity,
        backgroundColor: colors.primary,
        shadowColor: colors.shadow
      }
    ]}>
      <View style={styles.contentWrapper}>
        <Text
          style={[styles.text, { color: colors.text }]}
          numberOfLines={1}        // Limit to single line
          ellipsizeMode="tail"    // Add ... if text too long
        >
          {notification}
        </Text>
      </View>
    </Animated.View>
  );
};

// Styles for the banner
const styles = StyleSheet.create({
  container: {
    width: '100%',
    // Add subtle shadow effect
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,  // Shadow for Android
  },
  contentWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',   // Center content vertically
    alignItems: 'center',       // Center content horizontally
    minHeight: 40,             // Minimum height of banner
    flexDirection: 'row',      // Arrange items in a row
  },
  text: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,        // Spacing between letters
    lineHeight: 18,           // Height of each line of text
  },
});

export default NotificationBanner;