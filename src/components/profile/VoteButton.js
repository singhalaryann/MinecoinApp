import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Modal, View, Button, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import { NetworkInfo } from 'react-native-network-info';
import { Buffer } from 'buffer';
import axios from 'axios';
import { RSA } from 'react-native-rsa-native';
// Add new import for icon
import { Vote } from 'lucide-react-native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';

global.Buffer = Buffer;

const getVoterIP = async () => {
  try {
    const ipAddress = await NetworkInfo.getIPAddress();
    return ipAddress || "127.0.0.1";
  } catch (error) {
    console.error("Error retrieving IP address:", error);
    return "127.0.0.1";
  }
};

const encryptVoteData = async (voteData, publicKey) => {
  try {
    const encryptedVote = await RSA.encrypt(voteData, publicKey);
    return Buffer.from(encryptedVote, 'base64');
  } catch (error) {
    console.error("Error encrypting vote data:", error);
    throw new Error("Encryption failed");
  }
};

const sendVoteToMinecraftServer = async (votifierIP, votifierPort, publicKey, username, serviceName) => {
  try {
    const voterIP = await getVoterIP();

    const voteData = JSON.stringify({
      serviceName,
      username,
      address: voterIP,
      timestamp: Math.floor(Date.now() / 1000),
      additionalData: "Optional Data",
    });

    console.log("Vote Payload:", voteData);

    const encryptedVoteBuffer = await encryptVoteData(voteData, publicKey);

    const client = TcpSocket.createConnection({ host: votifierIP, port: votifierPort }, () => {
      console.log('Connected to Votifier server');
      client.write(encryptedVoteBuffer);
    });

    client.setTimeout(5000);

    client.on('data', (data) => {
      console.log('Response from server:', data.toString());
      client.end();
    });

    client.on('error', (error) => {
      console.error('Error:', error.message);
    });

    client.on('timeout', () => {
      console.error('Connection timed out');
      client.end();
    });

    client.on('end', () => {
      console.log('Connection to server closed');
    });
  } catch (error) {
    console.error('Error sending vote:', error.message);
  }
};

const PUBLIC_KEY = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuym8cwCU9zqqouh99hvXJjYK+9LMS2EmRLNZfjWMhjcv8RHXT1gp53/Lpk+0+regKKU0zxfy6IkIbsURr1Dswhwi6wGQIUYIQjGvG+mNRC1CnfP376JT866WyhxLDFU9g1oyb/6WWrJcf3dzwb020q3m8j3EsI8JCMbkmlsp7ZAKoLUWmOsuGKw76zgVpev9R426SJ8CsT5g9RBI2EtcBeDqPLtlCZtU/+8R+fhjrzpCTHoK6a9hE2tHvQzGhib5ETIxCS7jtuQqru0Ogm0Nw23gjfYx2PhBn3PVkpKYxq/AbrG8X5pLmUofOwbmcOvrDmQuyhR4MhGilrohdmq59QIDAQAB
-----END PUBLIC KEY-----
`;

export const sendVote = async (username) => {
  try {
    await axios.get('https://best-minecraft-servers.co/server-x-gaming.20608/vote');
    const response = await axios.post(
      'https://best-minecraft-servers.co/server-x-gaming.20608/vote',
      `username=${encodeURIComponent(username)}&voteSubmit=1`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.status === 200) {
      console.log('Vote successful');
      return true;
    }
    return false;  } catch (error) {
    console.error('Vote failed:', error);
    return false;
  }
};

const VoteSuccessModal = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Vote Successful</Text>
          <Text style={styles.modalMessage}>Thank you for voting!</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const VoteButton = ({ username, ip }) => {
  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;
  
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    checkCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkCooldown = async () => {
    try {
      const lastVoteTime = await AsyncStorage.getItem(`lastVote_${username}`);
      if (lastVoteTime) {
        const timePassed = Date.now() - parseInt(lastVoteTime);
        const remainingTime = Math.max(24 * 60 * 60 * 1000 - timePassed, 0);
        setCooldown(0);
      }
    } catch (error) {
      console.error('Error checking cooldown:', error);
    }
  };

  const updateCooldown = () => {
    setCooldown(prev => Math.max(prev - 1000, 0));
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVote = async () => {
    if (cooldown > 0 || isLoading) return;
    setIsLoading(true);

    try {
      const votifierIP = '157.173.220.203';
      const votifierPort = 35647;

      //await sendVoteToMinecraftServer(votifierIP, votifierPort, PUBLIC_KEY, username, 'X-GAMING');
      const openWebsite = () => {
        const url = 'https://best-minecraft-servers.co/server-x-gaming.20608/vote'; // Replace with the URL you want to open
        Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) {
                return Linking.openURL(url);
              } else {
                Alert.alert('Invalid URL', 'The URL cannot be opened on this device.');
              }
            })
            .catch((err) => console.error('An error occurred', err));
      };//await sendVote(username);
    openWebsite();
    //await AsyncStorage.setItem(`lastVote_${username}`, Date.now().toString());
    //setCooldown(24 * 60 * 60 * 1000);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (cooldown > 0) {
      return `Vote again in ${formatTime(cooldown)}`;
    }
    if (isLoading) {
      return 'Voting...';
    }
    return 'Vote Now!';
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.voteButton,
          (cooldown > 0 || isLoading) && styles.voteButtonDisabled
        ]}
        onPress={handleVote}
        disabled={cooldown > 0 || isLoading}
        activeOpacity={0.8}
      >
        {/* Add Vote icon */}
        <Vote size={20} color={colors.text} style={styles.icon} />
        <Text style={styles.voteText}>{getButtonText()}</Text>
      </TouchableOpacity>

      <VoteSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  voteButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row', // Add this to align icon and text
  },
  voteButtonDisabled: {
    backgroundColor: colors.mutedText,
  },
  voteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Add new style for icon
  icon: {
    marginRight: 8,
  },
});

export default VoteButton;