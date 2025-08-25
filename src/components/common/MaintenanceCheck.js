import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Video from 'react-native-video';


const MaintenanceCheck = ({ children }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  const [isInMaintenance, setIsInMaintenance] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const maintenanceRef = doc(db, 'appConfig', 'maintenance');
      const unsubscribe = onSnapshot(maintenanceRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsInMaintenance(false);  // Changed this line
          setMessage(data.message || 'App is under maintenance. Please try again later.');
        }
        setLoading(false);
      }, (error) => {
        console.error('Maintenance check error:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Setup maintenance check error:', error);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingBox, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading app...</Text>
        </View>
      </View>
    );
  }

  if (isInMaintenance) {
    return (
      <View style={[styles.videoContainer, { backgroundColor: colors.background }]}>
        <Video
                  source={require('../../../assets/maintaince.mp4')}
                  repeat
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  muted={false}
                  volume={10}
                  rate={1.0}
                  ignoreSilentSwitch="obey"
                />
        <View style={styles.overlay}>
          <Text style={[styles.title, { color: colors.text }]}>Maintenance Mode</Text>
          <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </View>
    );
  };

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default MaintenanceCheck;