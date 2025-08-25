import React from 'react';
import { View, Text, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Video from 'react-native-video';
import { useThemeColors } from '../../screens/theme';

const MaintenanceCheck = ({ children }) => {
  const colors = useThemeColors();
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
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.accent }]}>Loading app...</Text>
        </View>
      </View>
    );
  }

  if (isInMaintenance) {
    return (
      <View style={styles.videoContainer}>
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
          <Text style={[styles.title, { color: colors.accent }]}>Maintenance Mode</Text>
          <Text style={[styles.message, { color: colors.accent }]}>{message}</Text>
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
    backgroundColor: 'black',
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
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 2
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8
  },
  messageBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12
  },
  message: {
    fontSize: 16,
    textAlign: 'center'
  }
});

export default MaintenanceCheck;