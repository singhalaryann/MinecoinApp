# Nova SDK Integration - Real-Time Sync Guide

This document explains how the Nova SDK has been integrated into your MinecoinApp to provide real-time user sync and experience management.

## 🚀 Features Implemented

### 1. Real-Time User Sync
- **Automatic user registration** when logging in with Google
- **Real-time profile updates** including MC verification status and coin balance
- **Automatic experience loading** after user authentication
- **Guest user handling** when signed out

### 2. Enhanced Console Logging
- **Detailed Nova state monitoring** with emoji indicators
- **Real-time experience updates** logging
- **User profile changes** tracking
- **Error handling** with comprehensive logging

### 3. Debug Panel
- **Visual Nova state monitoring** with tabs for different views
- **Real-time data inspection** for experiences and user profiles
- **Profile update testing** functionality
- **Raw data viewing** for debugging

## 📱 How to Use

### Accessing the Debug Panel
1. **Launch the app** and sign in with Google
2. **Look for the purple debug button** (🔧) floating above the support button
3. **Tap the debug button** to open the Nova Debug Panel
4. **Use the tabs** to view different aspects of Nova data:
   - **Overview**: Connection status, user info, and experiences
   - **Experiences**: UI theme and game sections data
   - **Raw Data**: Complete Nova state JSON

### Console Monitoring
Open your development console to see real-time Nova updates:

```
🔄 Starting Nova user sync...
📊 User data: { email: "user@example.com", displayName: "User Name", ... }
🎯 Setting Nova user with profile: { displayName: "User Name", ... }
✅ Nova user set successfully
🆔 Nova internal userId: nova-uuid-here
🚀 Loading all Nova experiences...
📦 Experiences loaded: { home: {...}, theme: {...} }
🔍 Current Nova state: { userId: "user@example.com", ... }
```

## 🔧 Technical Implementation

### Files Modified/Created

1. **`src/context/AuthContext.js`** - Enhanced Nova integration
2. **`src/services/novaService.js`** - Nova utility functions
3. **`src/components/common/NovaDebugPanel.js`** - Debug interface
4. **`src/screens/MainScreen.js`** - Debug button integration
5. **`src/hooks/useNovaRealTime.js`** - Real-time monitoring hook

### Key Functions

#### `syncUserWithNova(userData, firestoreData)`
- Sets Nova user with comprehensive profile
- Loads all experiences automatically
- Provides detailed logging

#### `updateNovaUserProfile(updates)`
- Updates user profile in real-time
- Useful for tracking user behavior changes

#### `useNovaRealTime(experienceName)`
- Custom hook for real-time monitoring
- Automatic console logging of all changes

## 🎯 Nova Configuration

Your app is configured with:

```javascript
{
  organisationId: "0952e33a-5ba0-4104-baf0-d0904d87f85d",
  appId: "4f3c0206-d4ef-46d4-ac82-1aa63f09f7c5", 
  apiEndpoint: "https://nova-manager-475016739432.us-central1.run.app",
  apiKey: "key123",
  registry: NovaRegistry
}
```

## 📊 User Profile Data

Nova tracks the following user attributes:

- **Basic Info**: `displayName`, `email`
- **Game Status**: `hasMcVerified`, `mcUsername`
- **Economy**: `coinBalance`
- **Metadata**: `userType`, `lastLogin`, `platform`, `appVersion`
- **Custom Fields**: `totalGamesPlayed`, `joinDate`, `preferences`

## 🎨 Experiences Available

### 1. **Home Experience**
- `ui-theme`: Complete UI color scheme
- `game-sections`: Game categories and configurations
- `game-assets`: Dynamic game content
- `app-config`: App-wide settings

### 2. **Theme Experience**
- `ui-theme`: Global theming for consistent UI

### 3. **Game Assets Experience**
- `game-sections`: Section management
- `game-assets`: Asset configuration
- `app-config`: App configuration

## 🔄 Real-Time Sync Flow

1. **User Login** → Nova user registration
2. **Profile Update** → Automatic Nova sync
3. **Experience Loading** → Real-time data fetching
4. **State Changes** → Console logging + UI updates
5. **User Logout** → Guest user creation

## 🧪 Testing Features

### Profile Update Test
1. Open the Nova Debug Panel
2. Go to the Overview tab
3. Tap "🧪 Test Profile Update"
4. Watch console for real-time updates

### Real-Time Monitoring
1. Use the `useNovaRealTime` hook in your components
2. Monitor console for automatic logging
3. Check the debug panel for visual updates

## 🚨 Troubleshooting

### Common Issues

1. **Nova not connecting**
   - Check your internet connection
   - Verify API endpoint is accessible
   - Check console for error messages

2. **Experiences not loading**
   - Ensure user is properly set in Nova
   - Check `nova-objects.json` configuration
   - Verify experience names match registry

3. **Profile updates failing**
   - Check if user is authenticated
   - Verify Nova user ID exists
   - Check console for specific error messages

### Debug Steps

1. **Open Debug Panel** and check connection status
2. **Review Console Logs** for detailed error information
3. **Check Raw Data** tab for complete state inspection
4. **Test Profile Updates** to verify functionality

## 📈 Performance Considerations

- **Automatic caching** of Nova experiences
- **Lazy loading** of experience data
- **Efficient state updates** with React hooks
- **Minimal re-renders** through proper dependency management

## 🔮 Future Enhancements

- **Real-time collaboration** features
- **Advanced user segmentation**
- **Dynamic content personalization**
- **A/B testing integration**
- **Analytics and insights**

## 📚 Additional Resources

- [Nova React SDK Documentation](https://docs.nova.com)
- [Nova Manager API Reference](https://api.nova.com)
- [React Native Integration Guide](https://docs.nova.com/react-native)

---

**Note**: This integration provides a solid foundation for real-time user sync and experience management. The debug panel and comprehensive logging make it easy to monitor and troubleshoot Nova functionality in real-time.
