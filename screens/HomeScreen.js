import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, RefreshControl,
  Alert, ActionSheetIOS, Platform,
} from 'react-native';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';

export default function HomeScreen({ navigation, theme }) {
  const [user, setUser]         = useState(null);
  const [meals, setMeals]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // ── Long press meal card ─────────────────────────────────────────────────
  const handleLongPress = (meal) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Meal', 'Delete Meal'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: meal.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEdit(meal);
          if (buttonIndex === 2) handleDelete(meal);
        }
      );
    } else {
      Alert.alert(meal.name, 'What would you like to do?', [
        { text: 'Cancel', style: 'cancel' },
        { text: '✏️ Edit', onPress: () => handleEdit(meal) },
        { text: '🗑️ Delete', style: 'destructive', onPress: () => handleDelete(meal) },
      ]);
    }
  };

  const handleEdit = (meal) => {
    navigation.navigate('EditMeal', { meal });
  };

  const handleDelete = (meal) => {
    Alert.alert(
      'Delete meal',
      `Are you sure you want to delete "${meal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMeal(meal._id);
              setMeals(prev => prev.filter(m => m._id !== meal._id));
            } catch (err) {
              Alert.alert('Error', 'Could not delete meal.');
            }
          },
        },
      ]
    );
  };

  // ── Calorie calculations ─────────────────────────────────────────────────
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

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logoText, { color: theme.text }]}>Macroly</Text>
          <TouchableOpacity>
            <Text style={styles.cogText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.greeting, { color: theme.text }]}>Hey {username} 👋</Text>

        {/* Calorie Ring */}
        <Progress.Circle
          size={200}
          progress={caloriePercentage}
          color={isOverGoal ? '#ef4444' : theme.ring}
          unfilledColor={theme.ringBg}
          borderWidth={0}
          thickness={18}
          showsText={true}
          strokeCap="round"
          formatText={() => isOverGoal
            ? `+${caloriesEaten - calorieGoal}\nover`
            : `${caloriesLeft}\nleft`
          }
          direction={'counter-clockwise'}
          style={{ alignSelf: 'center', marginVertical: 16 }}
          textStyle={{ color: isOverGoal ? '#ef4444' : theme.text, fontWeight: '700' }}
        />

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
            <Text style={[styles.calorieStatNum, { color: isOverGoal ? '#ef4444' : theme.text }]}>
              {Math.abs(caloriesLeft)}
            </Text>
            <Text style={[styles.calorieStatLabel, { color: theme.textSecondary }]}>
              {isOverGoal ? 'Over' : 'Left'}
            </Text>
          </View>
        </View>

        {/* Macro bars */}
        <View style={[styles.macroContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Protein</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{proteinEaten}g / {proteinGoal}g</Text>
          </View>
          <Progress.Bar progress={proteinPercentage} width={null} color={'#FF6B6B'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Carbs</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{carbsEaten}g / {carbsGoal}g</Text>
          </View>
          <Progress.Bar progress={carbsPercentage} width={null} color={'#FFD93D'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Fat</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{fatEaten}g / {fatGoal}g</Text>
          </View>
          <Progress.Bar progress={fatPercentage} width={null} color={'#6BCB77'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          <View style={styles.mealsTitleRow}>
            <Text style={[styles.mealsTitle, { color: theme.text }]}>Today's Meals</Text>
            {meals.length > 0 && (
              <Text style={[styles.mealsHint, { color: theme.textTertiary }]}>
                Hold to edit or delete
              </Text>
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
              <TouchableOpacity
                key={meal._id}
                onLongPress={() => handleLongPress(meal)}
                delayLongPress={400}
                activeOpacity={0.7}
                style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
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
                    <View style={[styles.barFill, { width: `${Math.min((meal.protein / proteinGoal) * 100, 100)}%`, backgroundColor: '#FF6B6B' }]} />
                  </View>

                  <View style={styles.mealBarRow}>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Carbs</Text>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.carbs}g</Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
                    <View style={[styles.barFill, { width: `${Math.min((meal.carbs / carbsGoal) * 100, 100)}%`, backgroundColor: '#FFD93D' }]} />
                  </View>

                  <View style={styles.mealBarRow}>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Fat</Text>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.fat}g</Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
                    <View style={[styles.barFill, { width: `${Math.min((meal.fat / fatGoal) * 100, 100)}%`, backgroundColor: '#6BCB77' }]} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => navigation?.navigate('Scanner')}
      >
        <Text style={{ fontSize: 28 }}>📷</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  cogText: { fontSize: 22 },
  greeting: { fontSize: 22, fontWeight: '700', paddingHorizontal: 16, marginBottom: 4 },
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
  barBg: { height: 4, borderRadius: 2, marginBottom: 6 },
  barFill: { height: 4, borderRadius: 2 },
  floatingButton: { position: 'absolute', bottom: 30, right: 30, borderRadius: 16, padding: 15, borderWidth: 1 },
});