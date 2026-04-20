import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import api from '../api';

export default function EditMealScreen({ route, navigation, theme }) {
  const { meal } = route.params;

  const [name, setName]         = useState(meal.name     || '');
  const [calories, setCalories] = useState(String(meal.calories || 0));
  const [protein, setProtein]   = useState(String(meal.protein  || 0));
  const [carbs, setCarbs]       = useState(String(meal.carbs    || 0));
  const [fat, setFat]           = useState(String(meal.fat      || 0));
  const [loading, setLoading]   = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Meal name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.updateMeal(meal._id, {
        name:     name.trim(),
        emoji:    meal.emoji,
        calories: parseFloat(calories) || 0,
        protein:  parseFloat(protein)  || 0,
        carbs:    parseFloat(carbs)    || 0,
        fat:      parseFloat(fat)      || 0,
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Edit Meal</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Make changes to your logged meal
            </Text>
          </View>

          {/* Meal name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Meal name</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                color: theme.text,
              }]}
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.placeholder}
            />
          </View>

          {/* Macro grid */}
          <View style={[styles.macroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.macroCardTitle, { color: theme.textSecondary }]}>
              Nutrition values
            </Text>

            <View style={styles.macroGrid}>
              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Calories</Text>
                <TextInput
                  style={[styles.macroField, {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  }]}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#FF6B6B' }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.macroField, {
                    backgroundColor: theme.inputBg,
                    borderColor: '#FF6B6B',
                    color: theme.text,
                  }]}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="numeric"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#FFD93D' }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.macroField, {
                    backgroundColor: theme.inputBg,
                    borderColor: '#FFD93D',
                    color: theme.text,
                  }]}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#6BCB77' }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.macroField, {
                    backgroundColor: theme.inputBg,
                    borderColor: '#6BCB77',
                    color: theme.text,
                  }]}
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
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveButtonText}>Save Changes ✓</Text>
            }
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { padding: 24, gap: 20 },
  header: { gap: 6, marginBottom: 4 },
  backText: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    height: 50, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, fontSize: 15,
  },
  macroCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 16, gap: 14,
  },
  macroCardTitle: { fontSize: 13, fontWeight: '500' },
  macroGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  macroInput: { width: '47%', gap: 6 },
  macroField: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 16, fontWeight: '600',
  },
  saveButton: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', fontSize: 14, marginTop: 4 },
});