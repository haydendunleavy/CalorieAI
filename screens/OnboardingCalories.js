import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, ScrollView, ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const MACRO_FOCUSES = [
  { id: 'balanced', label: 'Balanced', description: 'Even split across all macros', proteinMult: 2.0, fatMult: 0.8 },
  { id: 'highProtein', label: 'High Protein', description: 'More protein, less fat', proteinMult: 2.3, fatMult: 0.7 },
  { id: 'highCarb', label: 'High Carb', description: 'More carbs for energy & performance', proteinMult: 1.8, fatMult: 0.6 },
  { id: 'lowCarb', label: 'Low Carb', description: 'Less carbs, more fat for fuel', proteinMult: 2.2, fatMult: 1.0 },
];

function clamp(value, min, max) {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function calculateMacrosLocally(weightKg, calories, macroFocus) {
  const focus = MACRO_FOCUSES.find(f => f.id === macroFocus) || MACRO_FOCUSES[0];
  let protein = Math.round(weightKg * focus.proteinMult);
  let fat = Math.round(weightKg * focus.fatMult);
  protein = clamp(protein, 120, 260);
  fat = clamp(fat, 40, 120);
  const remaining = calories - (protein * 4 + fat * 9);
  let carbs = Math.round(remaining / 4);
  carbs = clamp(carbs, 50, 600);
  return { protein, carbs, fat };
}

function calculateTDEE(weight, height, age, gender, unit, activityLevel) {
  let weightKg = parseFloat(weight);
  let heightCm = parseFloat(height);
  if (unit === 'imperial') {
    weightKg = weightKg * 0.453592;
    heightCm = heightCm * 30.48;
  }
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * parseFloat(age) + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * parseFloat(age) - 161;
  }
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

export default function OnboardingCalories({ navigation, route, theme }) {
  const params = route.params;
  const tdee = calculateTDEE(params.weight, params.height, params.age, params.gender, params.unit, params.activityLevel);
  const baseCalories = clamp(tdee + (params.modifier || 0), 1200, 4500);

  let weightKg = parseFloat(params.weight);
  if (params.unit === 'imperial') weightKg = weightKg * 0.453592;

  const [calories, setCalories] = useState(baseCalories);
  const [macroFocus, setMacroFocus] = useState('balanced');
  const [macros, setMacros] = useState(calculateMacrosLocally(weightKg, baseCalories, 'balanced'));
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Recalculate macros whenever calories or macroFocus changes
  useEffect(() => {
    const newMacros = calculateMacrosLocally(weightKg, calories, macroFocus);
    setMacros(newMacros);
  }, [calories, macroFocus]);

  const goalLabel = params.goal === 'cut' ? '🔥 Cutting' : params.goal === 'bulk' ? '💪 Bulking' : '⚖️ Maintaining';

  const handleFinish = async () => {
    setLoading(true);
    try {
      const data = await api.signup({
        username: params.username,
        nickname: params.nickname,
        email: params.email,
        phone: params.phone,
        password: params.password,
        gender: params.gender,
        age: parseInt(params.age),
        weight: parseFloat(params.weight),
        height: parseFloat(params.height),
        unit: params.unit,
        activityLevel: params.activityLevel,
        goal: params.goal,
        macroFocus,
        targetCalories: Math.round(calories),
      });

      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        navigation.replace('Welcome', {
          username: data.user.displayName || data.user.username,
          returningUser: false,
        });
      } else {
        alert(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      alert('Could not connect to server. Please check your connection.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          <View style={styles.progressRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} style={[styles.dot, { backgroundColor: theme.accent, width: i === 5 ? 24 : 8 }]} />
            ))}
          </View>

          <View style={styles.header}>
            <Text style={[styles.step, { color: theme.textTertiary }]}>Step 5 of 5</Text>
            <Text style={[styles.title, { color: theme.text }]}>Set your calories</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Based on your stats, your TDEE is {tdee} cal. We recommend {baseCalories} cal for {goalLabel}.
            </Text>
          </View>

          <View style={[styles.calorieCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.calorieNumber, { color: theme.accent }]}>{Math.round(calories)}</Text>
            <Text style={[styles.calorieLabel, { color: theme.textSecondary }]}>calories per day</Text>
          </View>

          <View style={styles.sliderSection}>
            <Slider
              style={styles.slider}
              minimumValue={1200}
              maximumValue={4500}
              step={50}
              value={calories}
              onValueChange={(val) => setCalories(Math.round(val))}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
            />
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.textTertiary }]}>1,200</Text>
              <Text style={[styles.sliderLabel, { color: theme.textTertiary }]}>4,500</Text>
            </View>
          </View>

          <View style={styles.focusSection}>
            <Text style={[styles.focusTitle, { color: theme.text }]}>Macro focus</Text>
            <Text style={[styles.focusSub, { color: theme.textSecondary }]}>Based on your bodyweight of {Math.round(weightKg)}kg</Text>
            <View style={styles.focusGrid}>
              {MACRO_FOCUSES.map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.focusOption, {
                    backgroundColor: macroFocus === f.id ? theme.accentLight : theme.surface,
                    borderColor: macroFocus === f.id ? theme.accent : theme.border,
                  }]}
                  onPress={() => setMacroFocus(f.id)}
                >
                  <Text style={[styles.focusLabel, { color: macroFocus === f.id ? theme.accent : theme.text }]}>{f.label}</Text>
                  <Text style={[styles.focusDesc, { color: theme.textTertiary }]}>{f.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.macroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.macroTitle, { color: theme.textSecondary }]}>Your daily macros</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#FF6B6B' }]} />
                <Text style={[styles.macroValue, { color: theme.text }]}>{macros.protein}g</Text>
                <Text style={[styles.macroName, { color: theme.textSecondary }]}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#FFD93D' }]} />
                <Text style={[styles.macroValue, { color: theme.text }]}>{macros.carbs}g</Text>
                <Text style={[styles.macroName, { color: theme.textSecondary }]}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#6BCB77' }]} />
                <Text style={[styles.macroValue, { color: theme.text }]}>{macros.fat}g</Text>
                <Text style={[styles.macroName, { color: theme.textSecondary }]}>Fat</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={handleFinish}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Let's go! 🚀</Text>}
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  content: { gap: 24, paddingTop: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  header: { gap: 8 },
  step: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  calorieCard: { alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1 },
  calorieNumber: { fontSize: 56, fontWeight: '800', letterSpacing: -2 },
  calorieLabel: { fontSize: 15, marginTop: 4 },
  sliderSection: { gap: 6 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontSize: 12 },
  focusSection: { gap: 10 },
  focusTitle: { fontSize: 16, fontWeight: '600' },
  focusSub: { fontSize: 12 },
  focusGrid: { gap: 8 },
  focusOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, gap: 2 },
  focusLabel: { fontSize: 14, fontWeight: '600' },
  focusDesc: { fontSize: 12 },
  macroCard: { padding: 20, borderRadius: 16, borderWidth: 1, gap: 14 },
  macroTitle: { fontSize: 13, fontWeight: '500' },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center', gap: 4 },
  macroDot: { width: 10, height: 10, borderRadius: 5 },
  macroValue: { fontSize: 20, fontWeight: '700' },
  macroName: { fontSize: 12 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
