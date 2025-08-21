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

const NotificationBanner = () => {
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
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.contentWrapper}>
        <Text
          style={styles.text}
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
    backgroundColor: '#00D4FF',  // Electric blue background color
    width: '100%',
    // Add enhanced shadow effect
    shadowColor: '#00D4FF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,  // Enhanced shadow for Android
  },
  contentWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',   // Center content vertically
    alignItems: 'center',       // Center content horizontally
    minHeight: 44,             // Enhanced minimum height of banner
    flexDirection: 'row',      // Arrange items in a row
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,        // Enhanced spacing between letters
    lineHeight: 20,           // Enhanced height of each line of text
    textShadowOffset: { width: 0, height: 1 },
    textShadowOpacity: 0.3,
    textShadowRadius: 2,
  },
});

export default NotificationBanner;