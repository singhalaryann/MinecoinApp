import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import { Gift, X, Star, Coins, Play, Shuffle, CheckCircle, AlertCircle } from 'lucide-react-native';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { savePurchaseHistory } from '../../config/firebase';
import InsufficientBalance from '../games/InsufficientBalanceModal';
import { Easing } from 'react-native';
import { colors as staticColors, useThemeColors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = (SCREEN_WIDTH * 0.85 - 72) / 3;
const BOX_MARGIN = 6;
const NUM_BOXES = 9;
const GRID_SIZE = 3;

const VISIBLE_SHUFFLE_STEPS = 5; // fewer visible shuffles
const INTERNAL_SHUFFLE_STEPS = 8; // more internal shuffles
const SHUFFLE_STEP_DELAY = 4; // 5ms delay for visible animation (very fast)

const getGridPosition = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return {
    x: col * (BOX_SIZE + BOX_MARGIN),
    y: row * (BOX_SIZE + BOX_MARGIN),
  };
};

const CalendarCard = () => {
  const [inputAmount, setInputAmount] = useState('');
  const [gameAssets, setGameAssets] = useState([]);
  const [showBoxSelection, setShowBoxSelection] = useState(false);
  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [reward, setReward] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [maxReward, setMaxReward] = useState(0);
  const [error, setError] = useState(null);
  const [gameSessionAssets, setGameSessionAssets] = useState([]);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showInitialItems, setShowInitialItems] = useState(true);
  const [readyToShuffle, setReadyToShuffle] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([...Array(NUM_BOXES).keys()]);
  const anims = useRef([...Array(NUM_BOXES)].map(() => new Animated.ValueXY(getGridPosition(0)))).current;
  const [isGettingReward, setIsGettingReward] = useState(false);
  const [rewardGiven, setRewardGiven] = useState(false);
  const [showRewardText, setShowRewardText] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { isLoggedIn, user, hasMcVerification } = useAuth();
  const { balance, subtractBalance, addBalance, hasSufficientBalance } = useUser();

  // NOVA THEME - Get live colors from dashboard
  const themeColors = useThemeColors();
  const colors = themeColors || staticColors;

  // Config state fetched from Firebase
  const [chancesConfig, setChancesConfig] = useState({
    assetChance: 0.6,
    coinChances: [
      { range: [0, 1], chance: 0.925 },
      { range: [2, 4], chance: 0.025 },
      { range: [4, 5], chance: 0.01 },
    ],
    maxRewardMultiplier: 5,
    assetCountRange: [4, 7],
    assetMaxPriceMultiplier: 3,
  });

  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'appConfig', 'luckyBoxChances');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          if (mounted) {
            const data = docSnap.data();
            const config = {
              assetChance: data.assetChance ?? 0.6,
              coinChances: data.coinChances ?? [
                { range: [0, 1], chance: 0.925 },
                { range: [2, 4], chance: 0.025 },
                { range: [4, 5], chance: 0.01 },
              ],
              maxRewardMultiplier: data.maxRewardMultiplier ?? 5,
              assetCountRange: data.assetCountRange ?? [4, 7],
              assetMaxPriceMultiplier: data.assetMaxPriceMultiplier ?? 3,
            };
            setChancesConfig(config);
          }
        } else {
          if (mounted) {
            setChancesConfig({
              assetChance: 0.6,
              coinChances: [
                { range: [0, 1], chance: 0.925 },
                { range: [2, 4], chance: 0.025 },
                { range: [4, 5], chance: 0.01 },
              ],
              maxRewardMultiplier: 5,
              assetCountRange: [4, 7],
              assetMaxPriceMultiplier: 3,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch chances config:', error);
      } finally {
        if (mounted) setLoadingConfig(false);
      }
    };

    fetchConfig();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch assets only once
  useEffect(() => {
    let mounted = true;
    const fetchAssets = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'gameAssets'), orderBy('price', 'asc')));
        const assets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (mounted) setGameAssets(assets);
      } catch (error) {
        setError('Failed to load game assets');
      }
    };
    fetchAssets();
    return () => {
      mounted = false;
    };
  }, []);

  // Defensive parse inputAmount helper
  const parsedAmount = useMemo(() => {
    const val = parseInt(inputAmount);
    return Number.isNaN(val) ? 0 : val;
  }, [inputAmount]);

  // Memoized asset filtering using dynamic max price multiplier
  const filteredAssets = useMemo(() => {
    if (!parsedAmount || !gameAssets.length) return [];
    const maxPrice = parsedAmount * (chancesConfig.assetMaxPriceMultiplier ?? 3);
    const filtered = gameAssets.filter(
      (asset) => asset.price && asset.price <= maxPrice && asset.price >= parsedAmount * 0.5
    );
    const [minAssets, maxAssets] = chancesConfig.assetCountRange ?? [4, 7];
    const targetCount = Math.min(
      filtered.length,
      Math.floor(Math.random() * (maxAssets - minAssets + 1)) + minAssets
    );
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, targetCount);
  }, [gameAssets, parsedAmount, chancesConfig]);

  // Generate boxes using dynamic chances
  const generateBoxes = (amount, assets) => {
    const newBoxes = [];

    // Adjust chances if no assets available
    let assetChance = chancesConfig.assetChance ?? 0.6;
    let coinChances = chancesConfig.coinChances ?? [
      { range: [0, 1], chance: 0.925 },
      { range: [2, 4], chance: 0.025 },
      { range: [4, 5], chance: 0.01 },
    ];

    if (assets.length === 0) {
      // Combine assetChance into first coin chance
      const combinedFirstChance = (coinChances[0].chance ?? 0) + assetChance;
      coinChances = [
        { ...coinChances[0], chance: combinedFirstChance },
        ...coinChances.slice(1),
      ];
      assetChance = 0; // no assets possible
    }

    for (let i = 0; i < NUM_BOXES; i++) {
      let content;
      const randomValue = Math.random();

      if (assets.length > 0 && randomValue < assetChance) {
        const randomAsset = assets[Math.floor(Math.random() * assets.length)];
        content = {
          type: 'asset',
          value: randomAsset.title,
          imageUrl: randomAsset.imageUrl,
          assetId: randomAsset.id,
          originalPrice: randomAsset.price,
          achievementText: randomAsset.achievementText || '',
        };
      } else {
        // Coins chance
        const coinRandom = Math.random();
        let cumulativeChance = 0;
        let selectedRange = [0, 1]; // default 0-1x

        for (const tier of coinChances) {
          cumulativeChance += tier.chance;
          if (coinRandom < cumulativeChance) {
            selectedRange = tier.range;
            break;
          }
        }

        const minMultiplier = selectedRange[0];
        const maxMultiplier = selectedRange[1];
        const multiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
        const coinReward = Math.floor(amount * multiplier);

        content = {
          type: 'coins',
          value: coinReward,
        };
      }

      newBoxes.push({
        id: i,
        content,
        opened: false,
      });
    }
    return newBoxes.sort(() => Math.random() - 0.5);
  };

  // Animate all boxes to their new positions with easing for smoothness
  const animateBoxesToOrder = (order, callback) => {
    const animations = order.map((boxIdx, gridIdx) => {
      const pos = getGridPosition(gridIdx);
      return Animated.timing(anims[boxIdx], {
        toValue: pos,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      });
    });
    Animated.parallel(animations).start(callback);
  };

  // Start game
  const handleStartGame = async () => {
    let amount = parsedAmount;
    if (!amount || amount < 50) {
      setError('Please enter a valid amount (minimum 50 coins)');
      return;
    }
    if (amount > 7000) amount = 7000;
    if (!isLoggedIn) {
      setError('Please login to play');
      return;
    }
    if (!hasSufficientBalance(amount)) {
      setShowInsufficientBalance(true);
      return;
    }
    setError(null);
    setIsStartingGame(true);
    try {
      await subtractBalance(amount);
      const [minAssets, maxAssets] = chancesConfig.assetCountRange ?? [4, 7];
      let assetCount = Math.max(minAssets, Math.min(maxAssets, filteredAssets.length));
      const sessionAssets = filteredAssets.slice(0, assetCount);
      setGameSessionAssets(sessionAssets);
      setMaxReward(amount * (chancesConfig.maxRewardMultiplier ?? 5));
      let initialBoxes = generateBoxes(amount, sessionAssets);
      setBoxes(initialBoxes);
      setShuffleOrder([...Array(NUM_BOXES).keys()]);
      // Set initial positions
      [...Array(NUM_BOXES).keys()].forEach((idx, i) => {
        anims[idx].setValue(getGridPosition(i));
      });
      setShowInitialItems(true);
      setShowBoxSelection(true);
      setIsStartingGame(false);
      setSelectedBox(null);
      setReward(null);
      setRewardGiven(false);
      setShowRewardText(false);
    } catch (err) {
      setError('Failed to start game. Try again.');
      setIsStartingGame(false);
      await addBalance(amount);
    }
  };

  // SHUFFLE ANIMATION
  const handleReadyClick = () => {
    setReadyToShuffle(true);
    setIsShuffling(true);
    setShowInitialItems(false);
    doShuffleAnimation(0, shuffleOrder);
  };

  const fisherYatesShuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const doShuffleAnimation = (step, currentOrder) => {
    if (step >= VISIBLE_SHUFFLE_STEPS) {
      let finalOrder = [...currentOrder];
      for (let i = 0; i < INTERNAL_SHUFFLE_STEPS; i++) {
        finalOrder = fisherYatesShuffle(finalOrder);
      }
      animateBoxesToOrder(finalOrder, () => {
        setShuffleOrder(finalOrder);
        setIsShuffling(false);
        setReadyToShuffle(false);
      });
      return;
    }
    const newOrder = [...currentOrder];
    const i = Math.floor(Math.random() * newOrder.length);
    let j = Math.floor(Math.random() * newOrder.length);
    while (j === i) j = Math.floor(Math.random() * newOrder.length);
    [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
    animateBoxesToOrder(newOrder, () => {
      setShuffleOrder(newOrder);
      setTimeout(() => doShuffleAnimation(step + 1, newOrder), SHUFFLE_STEP_DELAY);
    });
  };

  const shuffleBoxes = (boxes) => {
    return [...boxes].sort(() => Math.random() - 0.5);
  };

  const handleBoxSelect = useCallback(
    async (boxId) => {
      if (selectedBox !== null || purchasing || showInitialItems || isShuffling || isGettingReward) return;

      setPurchasing(true);
      setSelectedBox(boxId);
      setIsGettingReward(true);
      setShowRewardText(false);
      fadeAnim.setValue(0);

      const amount = parsedAmount;
      const selectedReward = boxes[shuffleOrder[boxId]].content;
      const isCoinReward = selectedReward.type === 'coins' && selectedReward.value > 0;

      try {
        if (isCoinReward) {
          await addBalance(selectedReward.value);
        }

        await savePurchaseHistory(user.email, {
          gameType: 'LuckyBox',
          amount,
          boxId,
          reward: selectedReward,
          title: selectedReward.type === 'asset' ? selectedReward.value : 'coins',
          purchaseDate: new Date(),
          maxPossibleReward: maxReward,
          gamegiven: isCoinReward,
        });

        setReward(selectedReward);
        setRewardGiven(true);
        setShowReward(true);
      } catch (error) {
        setSelectedBox(null);
        setError('Failed to get reward. Please try again.');
        await addBalance(amount);
      } finally {
        setIsGettingReward(false);
        setPurchasing(false);

        setShowRewardText(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }).start();
      }
    },
    [
      selectedBox,
      purchasing,
      showInitialItems,
      isShuffling,
      isGettingReward,
      parsedAmount,
      boxes,
      shuffleOrder,
      addBalance,
      savePurchaseHistory,
      user,
      maxReward,
      fadeAnim,
    ]
  );

  const resetGame = () => {
    setInputAmount('');
    setGameSessionAssets([]);
    setShowBoxSelection(false);
    setBoxes([]);
    setSelectedBox(null);
    setShowReward(false);
    setReward(null);
    setMaxReward(0);
    setError(null);
    setShowInitialItems(true);
    setIsShuffling(false);
    setIsStartingGame(false);
    setReadyToShuffle(false);
    setShuffleOrder([...Array(NUM_BOXES).keys()]);
    setRewardGiven(false);
    setShowRewardText(false);
    fadeAnim.setValue(0);
  };

  const renderBoxGrid = () => (
    <View
      style={{
        width: 3 * (BOX_SIZE + BOX_MARGIN),
        height: 3 * (BOX_SIZE + BOX_MARGIN),
        alignSelf: 'center',
        marginBottom: 20,
      }}
    >
      {shuffleOrder.map((boxIdx, gridIdx) =>
        boxes[boxIdx] ? (
          <Animated.View
            key={boxIdx}
            style={[
              styles.box,
              {
                position: 'absolute',
                ...anims[boxIdx].getLayout(),
                zIndex: selectedBox === gridIdx ? 2 : 1,
                borderColor: colors.border,
                backgroundColor: colors.backgroundLight,
                borderWidth: 2,
              },
              selectedBox === gridIdx && [styles.selectedBox, { 
                backgroundColor: colors.backgroundLight,
                borderColor: colors.border,
                borderWidth: 2
              }],
              showInitialItems || isShuffling || isGettingReward ? styles.disabledBox : null,
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => handleBoxSelect(gridIdx)}
              disabled={showInitialItems || isShuffling || selectedBox !== null || isGettingReward}
              activeOpacity={0.8}
            >
              {showInitialItems ? (
                <View style={styles.boxContent}>
                  {boxes[boxIdx].content.type === 'coins' ? (
                    <>
                      <Coins size={20} color={colors.accent} />
                      <Text style={[styles.rewardText, { color: colors.text }]}>{boxes[boxIdx].content.value}</Text>
                    </>
                  ) : (
                    <>
                      <Image
                        source={{ uri: boxes[boxIdx].content.imageUrl }}
                        style={styles.assetImage}
                        resizeMode="cover"
                      />
                    </>
                  )}
                </View>
              ) : selectedBox === gridIdx && rewardGiven ? (
                <View style={styles.boxContent}>
                  {boxes[boxIdx].content.type === 'coins' ? (
                    <>
                      <Coins size={20} color={colors.accent} />
                      <Text style={[styles.rewardText, { color: colors.text }]}>{boxes[boxIdx].content.value}</Text>
                    </>
                  ) : (
                    <>
                      <Image
                        source={{ uri: boxes[boxIdx].content.imageUrl }}
                        style={styles.assetImage}
                        resizeMode="cover"
                      />
                    </>
                  )}
                </View>
              ) : (
                <Gift size={28} color={selectedBox === gridIdx ? colors.accent : colors.text} />
              )}
            </TouchableOpacity>
          </Animated.View>
        ) : null
      )}
      {isGettingReward && (
        <View style={[styles.gettingRewardOverlay, { backgroundColor: colors.backgroundLight }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.gettingRewardText, { color: colors.text }]}>Getting your reward...</Text>
        </View>
      )}
    </View>
  );

  const getMultiplierText = () => {
    if (!reward || reward.type !== 'coins') return '';
    const multiplier = reward.value / parsedAmount;
    if (multiplier === 0) return 'Better luck next time!';
    return `${multiplier.toFixed(1)}x your bet!`;
  };

  if (loadingConfig) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      borderWidth: 2,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 12,
      elevation: 10
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <Gift size={24} color={colors.accent} />
        <Text style={[styles.title, { color: colors.text }]}>Lucky Box Game</Text>
      </View>
      {/* Current Balance Display */}
      <View style={[styles.balanceContainer, { 
        backgroundColor: colors.backgroundLight,
        borderColor: colors.border,
        borderWidth: 1
      }]}>
        <Text style={[styles.balanceLabel, { color: colors.text }]}>Your Balance:</Text>
        <View style={styles.balanceDisplay}>
          <Text style={[styles.balanceAmount, { color: colors.text }]}>{balance?.toLocaleString() || 0}</Text>
          <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
        </View>
      </View>
      {/* Amount Input Section */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter Amount to Play</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Win 0-5x your amount in coins or game assets!</Text>
        <View style={[styles.inputContainer, { 
          borderColor: colors.border, 
          backgroundColor: colors.card,
          borderWidth: 1
        }]}>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={inputAmount}
            onChangeText={(text) => {
              // Only digits allowed, capped at 7000
              let val = text.replace(/[^0-9]/g, '');
              if (val) {
                let numVal = parseInt(val);
                if (numVal > 7000) numVal = 7000;
                val = numVal.toString();
              }
              setInputAmount(val);
              setError(null);
            }}
            placeholder="Enter coins (min 50, max 7000)"
            placeholderTextColor={colors.text}
            keyboardType="numeric"
          />
          <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
        </View>
        {error && <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>}
        {parsedAmount >= 50 && (
          <View style={[styles.rewardPreview, { 
            backgroundColor: colors.backgroundLight,
            borderColor: colors.border,
            borderWidth: 1
          }]}>
            <Text style={[styles.previewText, { color: colors.text }]}>
              Max Possible Reward: {(parsedAmount * (chancesConfig.maxRewardMultiplier ?? 5)).toLocaleString()} Coins
            </Text>
            <Text style={[styles.previewText, { color: colors.text }]}>
              Coin Range: 0 - {(parsedAmount * (chancesConfig.maxRewardMultiplier ?? 5)).toLocaleString()} Coins
            </Text>
            {filteredAssets.length > 0 && (
              <Text style={[styles.previewText, { color: colors.text }]}>
                + Chance for {filteredAssets.length} game assets (within {chancesConfig.assetMaxPriceMultiplier ?? 3}x your amount)
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.startButton,
            (parsedAmount < 50 || isStartingGame) && styles.startButtonDisabled,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleStartGame}
          disabled={parsedAmount < 50 || isStartingGame}
        >
          {isStartingGame ? (
            <Text style={styles.startButtonText}>Starting Game...</Text>
          ) : (
            <>
              <Play size={20} color={colors.background} />
              <Text style={[styles.startButtonText, { color: colors.text }]}>Start Game</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* Probability Info */}
      <View style={[styles.probabilityContainer, { 
        backgroundColor: colors.backgroundLight,
        borderColor: colors.border,
        borderWidth: 1
      }]}>
        <Text style={[styles.probabilityTitle, { color: colors.text }]}>
          Win Chance: <Text style={{ color: colors.text }}>High!</Text>
        </Text>
        <Text style={[styles.probabilityText, { color: colors.text }]}>Most players win 2x or more! Try your luck 🎉</Text>
        <Text style={[styles.probabilityText, { color: colors.text }]}>
          • 0-{chancesConfig.maxRewardMultiplier ?? 5}x coins, {chancesConfig.assetCountRange?.[0] ?? 4}-
          {chancesConfig.assetCountRange?.[1] ?? 7} assets per game
        </Text>
      </View>
      {/* Available Assets Preview */}
      {gameAssets.length > 0 && (
        <View style={styles.assetsPreview}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All Game Assets ({gameAssets.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.assetsList}>
              {gameAssets.map((asset) => (
                <View key={asset.id} style={[styles.assetPreviewCard, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.backgroundLight,
                  borderWidth: 1
                }]}>
                  <Image
                    source={asset.imageUrl ? { uri: asset.imageUrl } : require('../../../assets/bat.png')}
                    style={styles.assetPreviewImage}
                    resizeMode="cover"
                  />
                  <Text style={[styles.assetPreviewTitle, { color: colors.text }]} numberOfLines={1}>
                    {asset.title}
                  </Text>
                  <Text style={[styles.assetPreviewPrice, { color: colors.text }]}>{asset.price} coins</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      {/* Box Selection Modal */}
      <Modal transparent visible={showBoxSelection} animationType="fade" onRequestClose={resetGame}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.backgroundLight }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Your Lucky Box ({parsedAmount} Coins)</Text>
              <TouchableOpacity onPress={resetGame} style={styles.closeButton}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.text }]}>
              Coin Range: 0 - {maxReward.toLocaleString()} Coins | {gameSessionAssets.length} Assets Available
            </Text>
            {/* Ready Button */}
            {showInitialItems && !readyToShuffle && !isShuffling && (
              <TouchableOpacity style={[styles.readyButton, { backgroundColor: colors.primary }]} onPress={handleReadyClick}>
                <Shuffle size={20} color={colors.background} />
                <Text style={[styles.readyButtonText, { color: colors.text }]}>Ready to Shuffle</Text>
              </TouchableOpacity>
            )}
            {/* Shuffling Button */}
            {isShuffling && (
              <>
                <View style={[styles.shufflingButton, { 
                  backgroundColor: colors.backgroundLight,
                  borderColor: colors.border,
                  borderWidth: 1
                }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.shufflingButtonText, { color: colors.text }]}>Shuffling...</Text>
                </View>
                {/* Audio only playback during shuffle */}
                <Video
                  source={{
                    uri: 'https://ik.imagekit.io/ypvwcoywn3/Moving%20around%20or%20shuffling%20sound%20effect%20%20%20(for%20animations).mp4?updatedAt=1749056364389',
                  }}
                  audioOnly={true}
                  paused={!isShuffling}
                  repeat={true}
                  volume={1000.0}
                  playInBackground={false}
                  playWhenInactive={false}
                  ignoreSilentSwitch="ignore"
                  style={{ height: 0, width: 0 }}
                />
              </>
            )}
            {renderBoxGrid()}
            {!showInitialItems && selectedBox === null && !isShuffling && !isGettingReward && (
              <Text style={[styles.instructionText, { color: colors.text }]}>Select a box to reveal your reward!</Text>
            )}
            {showInitialItems && !readyToShuffle && !isShuffling && (
              <Text style={[styles.instructionText, { color: colors.text }]}>Study the items carefully, then click "Ready to Shuffle"!</Text>
            )}
          </View>
        </View>
      </Modal>
      {/* Reward Modal */}
      <Modal transparent visible={showReward} animationType="fade" onRequestClose={resetGame}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.backgroundLight }]}>
          <View style={[styles.rewardModal, { backgroundColor: colors.card }]}>
            {showRewardText ? (
              <>
                <Text style={[styles.congratsText, { color: colors.text }]}>
                  {reward?.type === 'coins' && reward?.value === 0 ? 'Better Luck Next Time!' : 'Congratulations! 🎉'}
                </Text>
                <Text style={[styles.rewardIsThisText, { color: colors.text }]}>Your reward is:</Text>
                <View style={styles.rewardDisplay}>
                  {reward?.type === 'coins' ? (
                    <>
                      <Coins size={48} color={reward.value === 0 ? colors.text : colors.accent} />
                      <Text style={[
                        styles.rewardValue, 
                        reward.value === 0 && { color: colors.text }
                      ]}>
                        {reward.value.toLocaleString()} Coins
                      </Text>
                      <Text style={[styles.rewardMultiplier, { color: colors.text }]}>{getMultiplierText()}</Text>
                    </>
                  ) : (
                    <>
                      {reward?.imageUrl ? (
                        <Image source={{ uri: reward.imageUrl }} style={styles.rewardAssetImage} resizeMode="cover" />
                      ) : (
                        <Star size={48} color={colors.primary} />
                      )}
                      <Text style={[styles.rewardValue, { color: colors.text }]}>{reward?.value}</Text>
                      <Text style={[styles.rewardMultiplier, { color: colors.text }]}>Worth {reward?.originalPrice} coins!</Text>
                      {reward?.achievementText && <Text style={[styles.rewardDescription, { color: colors.text }]}>{reward.achievementText}</Text>}
                    </>
                  )}
                </View>
              </>
            ) : null}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                style={[styles.playAgainButton, !rewardGiven && styles.startButtonDisabled, { backgroundColor: colors.primary }]}
                onPress={resetGame}
                disabled={!rewardGiven}
              >
                <Text style={[styles.playAgainText, { color: colors.text }]}>Play Again</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>
      <InsufficientBalance visible={showInsufficientBalance} onClose={() => setShowInsufficientBalance(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... your existing styles unchanged ...
  rewardIsThisText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  gettingRewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gettingRewardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    borderRadius: 20,
    padding: 20,
    margin: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 8,
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 14,
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    padding: 12,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
  },
  rewardPreview: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  startButtonDisabled: {
    // backgroundColor will be applied dynamically
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  probabilityContainer: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  probabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  probabilityText: {
    fontSize: 12,
    marginBottom: 2,
  },
  assetsPreview: {
    marginBottom: 20,
  },
  assetsList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  assetPreviewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    width: 80,
    alignItems: 'center',
  },
  assetPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginBottom: 4,
  },
  assetPreviewTitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  assetPreviewPrice: {
    fontSize: 9,
  },
  noAssetsCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAssetsText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    padding: 20,
    maxHeight: '80%',
    
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shufflingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
  },
  shufflingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 20,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 2,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBox: {
    // backgroundColor will be applied dynamically
  },
  disabledBox: {
    opacity: 0.7,
  },
  boxContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  assetText: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  assetImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  rewardModal: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    
  },
  congratsText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  rewardDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  zeroReward: {
    // color will be applied dynamically
  },
  rewardMultiplier: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  rewardAssetImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  playAgainButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CalendarCard;