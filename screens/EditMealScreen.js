import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import api from '../api';

export default function EditMealScreen({ route, navigation, theme }) {
  const { meal } = route.params;

  const [name, setName] = useState(meal.name || '');
  const [calories, setCalories] = useState(String(meal.calories || 0));
  const [protein, setProtein] = useState(String(meal.protein || 0));
  const [carbs, setCarbs] = useState(String(meal.carbs || 0));
  const [fat, setFat] = useState(String(meal.fat || 0));
  const [loading, setLoading] = useState(false);

  // ───────────────────────────────────────────────────────────────
  // Slide‑up + fade‑in animation
  // ───────────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ───────────────────────────────────────────────────────────────
  // Save meal
  // ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Meal name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.updateMeal(meal._id, {
        name: name.trim(),
        emoji: meal.emoji,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
      });

      if (result._id) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message || 'Could not update meal.');
      }
    } catch (err) {
      Alert.alert('Connection error', 'Could not connect to server.');
    }
    setLoading(false);
  };

  // ───────────────────────────────────────────────────────────────
  // Delete meal
  // ───────────────────────────────────────────────────────────────
  const handleDelete = () => {
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
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Could not delete meal.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.emoji, { color: theme.text }]}>{meal.emoji}</Text>
              <Text style={[styles.title, { color: theme.text }]}>Edit Meal</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Update your logged meal
              </Text>
            </View>

            {/* Meal name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Meal name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={theme.placeholder}
              />
            </View>

            {/* Macro grid */}
            <View
              style={[
                styles.macroCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.macroCardTitle, { color: theme.textSecondary }]}>
                Nutrition values
              </Text>

              <View style={styles.macroGrid}>
                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Calories</Text>
                  <TextInput
                    style={[
                      styles.macroField,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                      },
                    ]}
                    value={calories}
                    onChangeText={setCalories}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: '#FF6B6B' }]}>Protein (g)</Text>
                  <TextInput
                    style={[
                      styles.macroField,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: '#FF6B6B',
                        color: theme.text,
                      },
                    ]}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: '#FFD93D' }]}>Carbs (g)</Text>
                  <TextInput
                    style={[
                      styles.macroField,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: '#FFD93D',
                        color: theme.text,
                      },
                    ]}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: '#6BCB77' }]}>Fat (g)</Text>
                  <TextInput
                    style={[
                      styles.macroField,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: '#6BCB77',
                        color: theme.text,
                      },
                    ]}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                </View>
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.accent }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes ✓</Text>
              )}
            </TouchableOpacity>

            {/* Delete button */}
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.danger }]}
              onPress={handleDelete}
            >
              <Text style={[styles.deleteText, { color: theme.danger }]}>Delete Meal</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  sheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    paddingTop: 20,
    overflow: 'hidden',
  },

  scroll: { padding: 24, gap: 20 },

  header: { alignItems: 'center', gap: 6, marginBottom: 4 },
  emoji: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },

  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },

  macroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },

  macroCardTitle: { fontSize: 13, fontWeight: '500' },

  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  macroInput: { width: '47%', gap: 6 },

  macroField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  deleteButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteText: { fontSize: 16, fontWeight: '600' },

  cancel: { textAlign: 'center', fontSize: 14, marginTop: 4 },
});
