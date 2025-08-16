import React, { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid, StatusBar } from 'react-native';
import PermissionsDialog from './PermissionsDialog'; 
import messaging from '@react-native-firebase/messaging';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import AppNavigator from './src/navigation/AppNavigator';
import MaintenanceCheck from './src/components/common/MaintenanceCheck';
import { adapty } from 'react-native-adapty';
import { NovaProvider } from 'nova-react-sdk';
import NovaRegistry from './src/nova-objects.json';

adapty.activate('public_live_a2ZpIYeH.UBLMWSv1MLfHElcx8N9j');

// UPDATED: Simplified NovaLoader - no loading here anymore
const NovaLoader = ({ children }) => {
  // Just pass through children - loading happens after login in AuthContext
  return children;
};

const App = () => {
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.DENIED) {
            setShowPermissionsDialog(true);
          }
        } catch (err) {
          console.warn('Permission request error:', err);
          setShowPermissionsDialog(true);
        }
      }
    };

    requestPermissions();

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });
  }, []);

  const handleRequestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          setShowPermissionsDialog(true);
        } else {
          setShowPermissionsDialog(false);
        }
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }
  };

  return (
    <>
      <PermissionsDialog
        visible={showPermissionsDialog}
        onRequestPermissions={handleRequestPermissions}
      />
      <NovaProvider
        config={{
          organisationId: "0952e33a-5ba0-4104-baf0-d0904d87f85d", 
          appId: "4f3c0206-d4ef-46d4-ac82-1aa63f09f7c5", 
          apiEndpoint: "https://nova-manager-475016739432.us-central1.run.app", 
          apiKey: "key123",
          registry: NovaRegistry,
        }}
      >
        <NovaLoader>
          <AuthProvider>
            <UserProvider>
              <MaintenanceCheck>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <SafeAreaProvider>
                    <StatusBar
                      barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                      backgroundColor="#0a0a0a"
                      translucent
                    />
                    <NavigationContainer>
                      <AppNavigator />
                    </NavigationContainer>
                  </SafeAreaProvider>
                </GestureHandlerRootView>
              </MaintenanceCheck>
            </UserProvider>
          </AuthProvider>
        </NovaLoader>
      </NovaProvider>
    </>
  );
};

export default App;