import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ theme }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  const username = user?.displayName || user?.nickname || user?.username || 'there';
  const calorieGoal = user?.calorieGoal || 2000;
  const proteinGoal = user?.proteinGoal || 150;
  const carbsGoal = user?.carbsGoal || 200;
  const fatGoal = user?.fatGoal || 65;

  const caloriesEaten = 0;
  const caloriesLeft = calorieGoal - caloriesEaten;
  const caloriePercentage = (caloriesEaten / calorieGoal) * 100;
  const proteinEaten = 0;
  const carbsEaten = 0;
  const fatEaten = 0;
  const proteinPercentage = (proteinEaten / proteinGoal) * 100;
  const carbsPercentage = (carbsEaten / carbsGoal) * 100;
  const fatPercentage = (fatEaten / fatGoal) * 100;

  const meals = [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>

        <View style={styles.header}>
          <Text style={[styles.logoText, { color: theme.text }]}>CalAI</Text>
          <TouchableOpacity>
            <Text style={styles.cogText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.greeting, { color: theme.text }]}>Hey {username} 👋</Text>

        <Progress.Circle
          size={200}
          progress={caloriePercentage / 100}
          color={theme.ring}
          unfilledColor={theme.ringBg}
          borderWidth={0}
          thickness={18}
          showsText={true}
          strokeCap="round"
          formatText={() => `${caloriesLeft}\ncals left`}
          direction={'counter-clockwise'}
          style={{ alignSelf: 'center', marginVertical: 16 }}
          textStyle={{ color: theme.text, fontWeight: '700' }}
        />

        <View style={[styles.macroContainer, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Protein</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{proteinEaten}g / {proteinGoal}g</Text>
          </View>
          <Progress.Bar progress={proteinPercentage / 100} width={null} color={'#FF6B6B'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Carbs</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{carbsEaten}g / {carbsGoal}g</Text>
          </View>
          <Progress.Bar progress={carbsPercentage / 100} width={null} color={'#FFD93D'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />

          <View style={styles.macroRow}>
            <Text style={[styles.macroLabel, { color: theme.text }]}>Fat</Text>
            <Text style={[styles.macroValue, { color: theme.textSecondary }]}>{fatEaten}g / {fatGoal}g</Text>
          </View>
          <Progress.Bar progress={fatPercentage / 100} width={null} color={'#6BCB77'} unfilledColor={theme.ringBg} borderWidth={0} height={10} borderRadius={5} style={{ width: '100%' }} />
        </View>

        <View style={styles.mealsContainer}>
          <Text style={[styles.mealsTitle, { color: theme.text }]}>Today's Meals</Text>

          {meals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No meals logged yet today</Text>
              <Text style={[styles.emptySubText, { color: theme.textTertiary }]}>Tap the 📷 button to scan food</Text>
            </View>
          ) : (
            meals.map((meal) => (
              <View key={meal.id} style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealNameRow}>
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    <Text style={[styles.mealName, { color: theme.text }]}>{meal.name}</Text>
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
                    <View style={[styles.barFill, { width: `${(meal.protein / proteinGoal) * 100}%`, backgroundColor: '#FF6B6B' }]} />
                  </View>

                  <View style={styles.mealBarRow}>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Carbs</Text>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.carbs}g</Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
                    <View style={[styles.barFill, { width: `${(meal.carbs / carbsGoal) * 100}%`, backgroundColor: '#FFD93D' }]} />
                  </View>

                  <View style={styles.mealBarRow}>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>Fat</Text>
                    <Text style={[styles.mealBarLabel, { color: theme.textSecondary }]}>{meal.fat}g</Text>
                  </View>
                  <View style={[styles.barBg, { backgroundColor: theme.ringBg }]}>
                    <View style={[styles.barFill, { width: `${(meal.fat / fatGoal) * 100}%`, backgroundColor: '#6BCB77' }]} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <TouchableOpacity style={[styles.floatingButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
  macroContainer: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, padding: 16, gap: 6 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 4 },
  macroLabel: { fontSize: 14, fontWeight: '500' },
  macroValue: { fontSize: 14 },
  mealsContainer: { padding: 16, paddingBottom: 100 },
  mealsTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyCard: {
    borderRadius: 16, borderWidth: 0.5, padding: 32,
    alignItems: 'center', gap: 8,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptySubText: { fontSize: 13 },
  mealCard: { borderRadius: 16, borderWidth: 0.5, padding: 14, marginBottom: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealEmoji: { fontSize: 24 },
  mealName: { fontSize: 14, fontWeight: '500' },
  calorieBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  calorieBadgeText: { fontSize: 13, fontWeight: '500' },
  mealBars: { gap: 4 },
  mealBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  mealBarLabel: { fontSize: 10 },
  barBg: { height: 4, borderRadius: 2, marginBottom: 6 },
  barFill: { height: 4, borderRadius: 2 },
  floatingButton: { position: 'absolute', bottom: 30, right: 30, borderRadius: 16, padding: 15, borderWidth: 1 },
});