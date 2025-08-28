import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
  Button,
  Linking,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import { NetworkInfo } from 'react-native-network-info';
import { Buffer } from 'buffer';
import axios from 'axios';
import { RSA } from 'react-native-rsa-native';
import { Vote, ExternalLink, CheckCircle, Clock, Star } from 'lucide-react-native';
import { useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  } catch (error) {
    console.error('Error voting:', error);
    throw new Error('Failed to submit vote');
  }
};

const VoteButton = ({ style }) => {
  const colors = useThemeColors();
  const [showModal, setShowModal] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null);
  const [lastVoteTime, setLastVoteTime] = useState(null);
  const [canVote, setCanVote] = useState(true);

  useEffect(() => {
    checkLastVoteTime();
  }, []);

  const checkLastVoteTime = async () => {
    try {
      const lastVote = await AsyncStorage.getItem('lastVoteTime');
      if (lastVote) {
        const timeDiff = Date.now() - parseInt(lastVote);
        const hoursSinceLastVote = timeDiff / (1000 * 60 * 60);

        if (hoursSinceLastVote < 12) {
          setCanVote(false);
          setLastVoteTime(parseInt(lastVote));
        } else {
          setCanVote(true);
        }
      }
    } catch (error) {
      console.error('Error checking last vote time:', error);
    }
  };

  const handleVote = async () => {
    if (!canVote) {
      Alert.alert('Vote Cooldown', 'You can only vote once every 12 hours. Please try again later.');
      return;
    }

    setShowModal(true);
  };

  const confirmVote = async () => {
    setIsVoting(true);
    setVoteStatus('voting');

    try {
      const result = await sendVote('your_username_here');

      if (result) {
        setVoteStatus('success');
        await AsyncStorage.setItem('lastVoteTime', Date.now().toString());
        setLastVoteTime(Date.now());
        setCanVote(false);

        // Send vote to Minecraft server
        await sendVoteToMinecraftServer(
          'your_server_ip',
          8192,
          PUBLIC_KEY,
          'your_username_here',
          'BestMinecraftServers'
        );
      }
    } catch (error) {
      setVoteStatus('error');
      Alert.alert('Vote Error', error.message);
    } finally {
      setIsVoting(false);
    }
  };

  const openVoteWebsite = () => {
    const url = 'https://best-minecraft-servers.co/server-x-gaming.20608/vote';
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const formatTimeRemaining = () => {
    if (!lastVoteTime) return '';

    const timeDiff = Date.now() - lastVoteTime;
    const hoursRemaining = Math.max(0, 12 - (timeDiff / (1000 * 60 * 60)));

    if (hoursRemaining <= 0) return '';

    const hours = Math.floor(hoursRemaining);
    const minutes = Math.floor((hoursRemaining % 1) * 60);

    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: canVote ? colors.accent : colors.text + '40' },
          style
        ]}
        onPress={handleVote}
        activeOpacity={0.8}
        disabled={!canVote}
      >
        <Vote size={18} color={canVote ? colors.white : colors.text + '60'} style={styles.icon} />
        <Text style={[styles.text, { color: canVote ? colors.white : colors.text + '60' }]}>
          {canVote ? 'Vote' : 'Voted'}
        </Text>
        {!canVote && <Star size={14} color={colors.accent} style={styles.statusIcon} />}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background + 'CC' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {voteStatus === null && (
              <>
                <View style={[styles.modalIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Vote size={32} color={colors.accent} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Vote for X-Gaming
                </Text>
                <Text style={[styles.modalDescription, { color: colors.text + '80' }]}>
                  Support our server by voting! You'll receive rewards and help us grow.
                </Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.accent }]}
                    onPress={confirmVote}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.white }]}>
                      Vote Now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={openVoteWebsite}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={16} color={colors.text} style={styles.buttonIcon} />
                    <Text style={[styles.modalButtonText, styles.secondaryButtonText, { color: colors.text }]}>
                      Open Website
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowModal(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.modalButtonText, styles.cancelButtonText, { color: colors.text + '80' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {voteStatus === 'voting' && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Submitting your vote...</Text>
              </View>
            )}

            {voteStatus === 'success' && (
              <View style={styles.successContainer}>
                <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
                  <CheckCircle size={32} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.text }]}>
                  Vote Successful!
                </Text>
                <Text style={[styles.successDescription, { color: colors.text + '80' }]}>
                  Thank you for voting! Your rewards have been added to your account.
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    setShowModal(false);
                    setVoteStatus(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {voteStatus === 'error' && (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Failed to submit vote. Please try again.
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    setShowModal(false);
                    setVoteStatus(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    position: 'relative',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontWeight: '500',
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default VoteButton;