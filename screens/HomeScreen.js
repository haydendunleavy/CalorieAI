import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { BlurView } from 'expo-blur';
import api from '../api';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const blurSupported =
  Platform.OS !== 'web' &&
  Constants.appOwnership !== 'expo';

// ── Glow helper ─────────────────────────────────────────────────────────────
// Dark mode → subtle glow, Light mode → medium glow
const getGlow = (isDark, color, intensity = 'auto') => {
  const level = intensity === 'auto' ? (isDark ? 'subtle' : 'medium') : intensity;
  const glows = {
    subtle: {
      blue:    '0 0 10px rgba(59,130,246,0.25)',
      protein: '0 0 6px rgba(255,107,107,0.35)',
      carbs:   '0 0 6px rgba(255,217,61,0.35)',
      fat:     '0 0 6px rgba(107,203,119,0.35)',
    },
    medium: {
      blue:    '0 0 18px rgba(59,130,246,0.45)',
      protein: '0 0 10px rgba(255,107,107,0.55)',
      carbs:   '0 0 10px rgba(255,217,61,0.55)',
      fat:     '0 0 10px rgba(107,203,119,0.55)',
    },
  };
  return glows[level]?.[color] || '';
};

// React Native shadow helper (iOS uses shadow*, Android uses elevation)
const glowShadow = (isDark, colorKey) => {
  const isSubtle = isDark;
  const colors = {
    blue:    { color: '#3b82f6', opacity: isSubtle ? 0.3 : 0.55 },
    protein: { color: '#FF6B6B', opacity: isSubtle ? 0.3 : 0.55 },
    carbs:   { color: '#FFD93D', opacity: isSubtle ? 0.3 : 0.55 },
    fat:     { color: '#6BCB77', opacity: isSubtle ? 0.3 : 0.55 },
  };
  const c = colors[colorKey];
  return Platform.select({
    ios: {
      shadowColor: c.color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: c.opacity,
      shadowRadius: isSubtle ? 6 : 10,
    },
    android: {
      elevation: isSubtle ? 4 : 8,
    },
  });
};

export default function HomeScreen({ navigation, theme }) {
  const isDark = theme.background === '#0f172a';

  const [user, setUser]         = useState(null);
  const [meals, setMeals]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [animMeal, setAnimMeal] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const [cardLayouts, setCardLayouts] = useState({});
  const scrollRef = useRef(null);

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  };

  const loadMeals = async () => {
    try {
      const data = await api.getMeals();
      if (Array.isArray(data)) setMeals(data);
    } catch (err) {
      console.log('Could not load meals:', err.message);
    }
  };

  const loadAll = async () => {
    await Promise.all([loadUser(), loadMeals()]);
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleCardLayout = (mealId, layout) => {
    setCardLayouts(prev => ({ ...prev, [mealId]: layout }));
  };

  const handleCardPress = (meal) => {
    const layout = cardLayouts[meal._id];
    if (!layout) { navigation.navigate('EditMeal', { meal }); return; }
    const scrollY = scrollRef.current?._scrollPos || 0;
    setAnimMeal({ meal, layout: { x: layout.x, y: layout.y - scrollY, width: layout.width, height: layout.height } });
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  };

  const TARGET_WIDTH = SCREEN_WIDTH * 0.9;
  const TARGET_X = (SCREEN_WIDTH - TARGET_WIDTH) / 2;
  const TARGET_Y = SCREEN_HEIGHT * 0.32;

  let cloneStyle = {};
  if (animMeal) {
    cloneStyle = {
      position: 'absolute',
      left:  anim.interpolate({ inputRange: [0,1], outputRange: [animMeal.layout.x, TARGET_X] }),
      top:   anim.interpolate({ inputRange: [0,1], outputRange: [animMeal.layout.y, TARGET_Y] }),
      width: anim.interpolate({ inputRange: [0,1], outputRange: [animMeal.layout.width, TARGET_WIDTH] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0,1], outputRange: [1, 1.1] }) }],
    };
  }

  const blurOpacity = anim.interpolate({ inputRange: [0,1], outputRange: [0,1] });

  const username     = user?.displayName || user?.nickname || user?.username || 'there';
  const calorieGoal  = user?.calorieGoal || 2000;
  const proteinGoal  = user?.proteinGoal || 150;
  const carbsGoal    = user?.carbsGoal   || 200;
  const fatGoal      = user?.fatGoal     || 65;

  const caloriesEaten = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const proteinEaten  = meals.reduce((sum, m) => sum + (m.protein  || 0), 0);
  const carbsEaten    = meals.reduce((sum, m) => sum + (m.carbs    || 0), 0);
  const fatEaten      = meals.reduce((sum, m) => sum + (m.fat      || 0), 0);

  const caloriesLeft      = calorieGoal - caloriesEaten;
  const caloriePercentage = Math.min(caloriesEaten / calorieGoal, 1);
  const proteinPercentage = Math.min(proteinEaten  / proteinGoal, 1);
  const carbsPercentage   = Math.min(carbsEaten    / carbsGoal,   1);
  const fatPercentage     = Math.min(fatEaten      / fatGoal,     1);
  const isOverGoal        = caloriesEaten > calorieGoal;

  const ringColor = isOverGoal ? '#ef4444' : theme.ring;

  const renderMealCardContent = (meal) => (
    <>
      <View style={styles.mealHeader}>
        <View style={styles.mealNameRow}>
          <Text style={styles.mealEmoji}>{meal.emoji || '🍽️'}</Text>
          <Text style={[styles.mealName, { color: theme.text }]} numberOfLines={1}>{meal.name}</Text>
        </View>
        <View style={[styles.calorieBadge, { backgroundColor: theme.accentLight }]}>
          <Text style={[styles.calorieBadgeText, { color: theme.accent }]}>{meal.calories} cal</Text>
        </View>
      </View>

      <View style={styles.mealBars}>
        <View style={styles.mealBarRow}>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Protein</Text>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.protein}g</Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
          <View style={[styles.barFill, { width: `${Math.min((meal.protein / proteinGoal) * 100, 100)}%`, backgroundColor: '#FF6B6B', ...glowShadow(isDark, 'protein') }]} />
        </View>

        <View style={styles.mealBarRow}>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Carbs</Text>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.carbs}g</Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
          <View style={[styles.barFill, { width: `${Math.min((meal.carbs / carbsGoal) * 100, 100)}%`, backgroundColor: '#FFD93D', ...glowShadow(isDark, 'carbs') }]} />
        </View>

        <View style={styles.mealBarRow}>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Fat</Text>
          <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.fat}g</Text>
        </View>
        <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
          <View style={[styles.barFill, { width: `${Math.min((meal.fat / fatGoal) * 100, 100)}%`, backgroundColor: '#6BCB77', ...glowShadow(isDark, 'fat') }]} />
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scrollRef}
        onScroll={(e) => { scrollRef.current._scrollPos = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: theme.text }]}>Macroly</Text>
          <TouchableOpacity><Text style={styles.cogText}>⚙️</Text></TouchableOpacity>
        </View>

        <Text style={[styles.greeting, { color: theme.text }]}>Hey {username} 👋</Text>

        {/* Calorie Ring with glow wrapper */}
        <View style={styles.ringWrapper}>
          <View style={[
            styles.ringGlowContainer,
            glowShadow(isDark, 'blue'),
            { borderColor: ringColor + (isDark ? '22' : '33') },
          ]}>
            <Progress.Circle
              size={200}
              progress={caloriePercentage}
              color={ringColor}
              unfilledColor={theme.ringBg}
              borderWidth={0}
              thickness={18}
              showsText={true}
              strokeCap="round"
              formatText={() => isOverGoal ? `+${caloriesEaten - calorieGoal}\nover` : `${caloriesLeft}\nleft`}
              direction={'counter-clockwise'}
              textStyle={{ color: isOverGoal ? '#ef4444' : theme.text, fontWeight: '700' }}
            />
          </View>
        </View>

        {/* Calorie summary */}
        <View style={styles.calorieSummary}>
          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatNum, { color: theme.text }]}>{calorieGoal}</Text>
            <Text style={[styles.calorieStatLabel, { color: theme.textSecondary }]}>Goal</Text>
          </View>
          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatNum, { color: theme.accent }]}>{caloriesEaten}</Text>
            <Text style={[styles.calorieStatLabel, { color: theme.textSecondary }]}>Eaten</Text>
          </View>
          <View style={styles.calorieStat}>
            <Text style={[styles.calorieStatNum, { color: isOverGoal ? '#ef4444' : theme.text }]}>{Math.abs(caloriesLeft)}</Text>
            <Text style={[styles.calorieStatLabel, { color: theme.textSecondary }]}>{isOverGoal ? 'Over' : 'Left'}</Text>
          </View>
        </View>

        {/* Macro bars */}
        <View style={[styles.macroContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Protein</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{proteinEaten}g / {proteinGoal}g</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
            <View style={[styles.macroBarFill, { width: `${proteinPercentage * 100}%`, backgroundColor: '#FF6B6B', ...glowShadow(isDark, 'protein') }]} />
          </View>

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Carbs</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{carbsEaten}g / {carbsGoal}g</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
            <View style={[styles.macroBarFill, { width: `${carbsPercentage * 100}%`, backgroundColor: '#FFD93D', ...glowShadow(isDark, 'carbs') }]} />
          </View>

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Fat</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{fatEaten}g / {fatGoal}g</Text>
          </View>
          <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
            <View style={[styles.macroBarFill, { width: `${fatPercentage * 100}%`, backgroundColor: '#6BCB77', ...glowShadow(isDark, 'fat') }]} />
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          <View style={styles.mealsTitleRow}>
            <Text style={[styles.mealsTitle, { color: theme.text }]}>Today's Meals</Text>
            {meals.length > 0 && (
              <Text style={[styles.mealsHint, { color: theme.textTertiary }]}>Tap a meal to edit</Text>
            )}
          </View>

          {meals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No meals logged yet today</Text>
              <Text style={[styles.emptySubText, { color: theme.textTertiary }]}>Tap the 📷 button to scan food</Text>
            </View>
          ) : (
            meals.map((meal) => (
              <View key={meal._id} onLayout={(e) => handleCardLayout(meal._id, e.nativeEvent.layout)}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                  onPress={() => handleCardPress(meal)}
                >
                  {renderMealCardContent(meal)}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating camera button with glow */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: theme.surface, borderColor: theme.border },
          glowShadow(isDark, 'blue'),
        ]}
        onPress={() => navigation?.navigate('Scanner')}
      >
        <Text style={{ fontSize: 28 }}>📷</Text>
      </TouchableOpacity>

      {/* Animated overlay */}
      {animMeal && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => { if (!animMeal) return; setAnimMeal(null); }}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
            {blurSupported ? (
              <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
            )}
          </Animated.View>

          <Animated.View style={cloneStyle} pointerEvents="box-none">
            <View
              pointerEvents="auto"
              style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingTop: 40 }]}
            >
              <View style={styles.cloneActions}>
                <TouchableOpacity onPress={() => { setAnimMeal(null); navigation.navigate('EditMeal', { meal: animMeal.meal }); }}>
                  <Text style={{ color: theme.accent, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => { await api.deleteMeal(animMeal.meal._id); setAnimMeal(null); loadMeals(); }}>
                  <Text style={{ color: 'red', fontWeight: '700' }}>Delete</Text>
                </TouchableOpacity>
              </View>
              {renderMealCardContent(animMeal.meal)}
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  cogText: { fontSize: 22 },
  greeting: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 4 },

  ringWrapper: { alignItems: 'center', marginVertical: 16 },
  ringGlowContainer: {
    borderRadius: 120,
    borderWidth: 1,
    padding: 8,
  },

  calorieSummary: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 8 },
  calorieStat: { alignItems: 'center', gap: 2 },
  calorieStatNum: { fontSize: 20, fontWeight: '700' },
  calorieStatLabel: { fontSize: 12 },

  macroContainer: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 16, gap: 6 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 },
  macroLabel: { fontSize: 14, fontWeight: '500' },
  macroValue: { fontSize: 14 },

  mealsContainer: { padding: 16, paddingBottom: 100 },
  mealsTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealsTitle: { fontSize: 18, fontWeight: '700' },
  mealsHint: { fontSize: 11 },

  emptyCard: { borderRadius: 16, borderWidth: 0.5, padding: 32, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptySubText: { fontSize: 13 },

  mealCard: { borderRadius: 16, borderWidth: 0.5, padding: 14, marginBottom: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  mealEmoji: { fontSize: 24 },
  mealName: { fontSize: 14, fontWeight: '500', flex: 1 },
  calorieBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  calorieBadgeText: { fontSize: 13, fontWeight: '500' },

  mealBars: { gap: 4 },
  mealBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  mealBarLabel: { fontSize: 10 },
  barBg: { height: 4, borderRadius: 2, marginBottom: 6, overflow: 'visible' },
  barFill: { height: 4, borderRadius: 2 },
  macroBarFill: { height: 10, borderRadius: 5 },

  floatingButton: { position: 'absolute', bottom: 30, right: 30, borderRadius: 16, padding: 15, borderWidth: 1 },
  cloneActions: { position: 'absolute', top: 18, right: 18, flexDirection: 'row', gap: 20, zIndex: 999 },
});