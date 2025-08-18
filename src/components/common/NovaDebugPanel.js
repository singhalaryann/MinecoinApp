import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { 
  getCurrentNovaProfile, 
  getExperienceData, 
  getUITheme, 
  getGameSections,
  getGameAssets,
  getAppConfig,
  logNovaState 
} from '../../services/novaService';

const NovaDebugPanel = ({ visible, onClose }) => {
  const { novaState, updateNovaUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh of Nova state
  const refreshNovaState = () => {
    setRefreshKey(prev => prev + 1);
    logNovaState(novaState, "Refreshed");
  };

  // Update user profile for testing
  const testProfileUpdate = async () => {
    if (!novaState?.user?.userId) {
      console.log("No user logged in for profile update test");
      return;
    }

    const testUpdates = {
      lastActivity: new Date().toISOString(),
      testField: `Test value ${Date.now()}`,
      coinBalance: Math.floor(Math.random() * 1000)
    };

    console.log("🧪 Testing Nova profile update with:", testUpdates);
    await updateNovaUserProfile(testUpdates);
  };

  if (!visible) return null;

  const currentProfile = getCurrentNovaProfile(novaState);
  const uiTheme = getUITheme(novaState);
  const gameSections = getGameSections(novaState);
  const gameAssets = getGameAssets(novaState);
  const appConfig = getAppConfig(novaState);

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🔄 Nova Connection Status</Text>
      <View style={styles.statusRow}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: novaState?.error ? '#ef4444' : '#10b981' }]}>
          {novaState?.error ? '❌ Error' : '✅ Connected'}
        </Text>
      </View>
      
      <Text style={styles.sectionTitle}>👤 User Information</Text>
      {currentProfile ? (
        <View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>External User ID:</Text>
            <Text style={styles.value}>{currentProfile.externalUserId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nova User ID:</Text>
            <Text style={styles.value}>{currentProfile.novaUserId || 'Not assigned'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>User Type:</Text>
            <Text style={styles.value}>{currentProfile.profile?.userType || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>MC Verified:</Text>
            <Text style={styles.value}>{currentProfile.profile?.hasMcVerified ? '✅ Yes' : '❌ No'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Coin Balance:</Text>
            <Text style={styles.value}>{currentProfile.profile?.coinBalance || 0}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.noData}>No user profile available</Text>
      )}

      <Text style={styles.sectionTitle}>📱 Experiences</Text>
      {novaState?.experiences ? (
        <View>
          <Text style={styles.label}>Loaded Experiences:</Text>
          {Object.keys(novaState.experiences).map(expName => (
            <Text key={expName} style={styles.experienceItem}>• {expName}</Text>
          ))}
        </View>
      ) : (
        <Text style={styles.noData}>No experiences loaded</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={testProfileUpdate}>
        <Text style={styles.buttonText}>🧪 Test Profile Update</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExperiences = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🎨 UI Theme</Text>
      {uiTheme ? (
        <ScrollView style={styles.dataContainer}>
          {Object.entries(uiTheme).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.dataKey}>{key}:</Text>
              <Text style={styles.dataValue}>
                {typeof value === 'string' && value.startsWith('#') ? (
                  <View style={[styles.colorPreview, { backgroundColor: value }]} />
                ) : (
                  String(value)
                )}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noData}>No UI theme data available</Text>
      )}

      <Text style={styles.sectionTitle}>🎮 Game Sections</Text>
      {gameSections ? (
        <ScrollView style={styles.dataContainer}>
          {Object.entries(gameSections).map(([key, value]) => (
            <View key={key} style={styles.dataRow}>
              <Text style={styles.dataKey}>{key}:</Text>
              <Text style={styles.dataValue}>{JSON.stringify(value)}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noData}>No game sections data available</Text>
      )}
    </View>
  );

  const renderRawData = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🔍 Raw Nova State</Text>
      <ScrollView style={styles.rawDataContainer}>
        <Text style={styles.rawData}>
          {JSON.stringify(novaState, null, 2)}
        </Text>
      </ScrollView>
    </View>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'experiences':
        return renderExperiences();
      case 'raw':
        return renderRawData();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Nova Debug Panel</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]} 
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'experiences' && styles.activeTab]} 
          onPress={() => setActiveTab('experiences')}
        >
          <Text style={[styles.tabText, activeTab === 'experiences' && styles.activeTabText]}>
            Experiences
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'raw' && styles.activeTab]} 
          onPress={() => setActiveTab('raw')}
        >
          <Text style={[styles.tabText, activeTab === 'raw' && styles.activeTabText]}>
            Raw Data
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderTab()}
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={refreshNovaState}>
            <Text style={styles.buttonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginTop: 20,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  label: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#f3f4f6',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  noData: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  experienceItem: {
    fontSize: 14,
    color: '#d1d5db',
    paddingVertical: 4,
    paddingLeft: 20,
  },
  dataContainer: {
    maxHeight: 200,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dataKey: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: '#f3f4f6',
    flex: 2,
    textAlign: 'right',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  rawDataContainer: {
    maxHeight: 400,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 15,
  },
  rawData: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  actions: {
    marginTop: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NovaDebugPanel;
