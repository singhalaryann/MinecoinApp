import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from '../screens/MainScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
// import ProcessPurchaseScreen from '../screens/ProcessPurchaseScreen';
import CoinBundleScreen from '../screens/CoinBundleScreen';
import ProfileScreen from '../screens/ProfileScreen';
// import CheckoutScreen from '../screens/CheckoutScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'rgba(2, 5, 14, 0.95)' }
      }}
    >
      <Stack.Screen name="Main" component={MainScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {/* <Stack.Screen name="ProcessPurchase" component={ProcessPurchaseScreen} /> */}
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="CoinBundle" component={CoinBundleScreen} />
      {/* <Stack.Screen name="Checkout" component={CheckoutScreen} /> */}
    </Stack.Navigator>
  );
};

export default AppNavigator;