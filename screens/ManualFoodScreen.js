import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import api from '../api';

const QUICK_EMOJIS = ['🍽️', '🥗', '🍗', '🥩', '🐟', '🥚', '🧀', '🥛', '🍞', '🍚', '🍝', '🥣', '🥦', '🍎', '🍌', '🥜', '🧁', '🍫', '🥤', '☕'];

export default function ManualFoodScreen({ navigation, theme }) {
  const [name, setName]             = useState('');
  const [calories, setCalories]     = useState('');
  const [protein, setProtein]       = useState('');
  const [carbs, setCarbs]           = useState('');
  const [fat, setFat]               = useState('');
  const [emoji, setEmoji]           = useState('🍽️');
  const [loading, setLoading]       = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [autoCalc, setAutoCalc]     = useState(true);

  // Auto-calculate calories using 4-4-9 rule when macros change
  useEffect(() => {
    if (!autoCalc) return;
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs)   || 0;
    const f = parseFloat(fat)     || 0;
    const calculated = Math.round((p * 4) + (c * 4) + (f * 9));
    if (calculated > 0) {
      setCalories(String(calculated));
    }
  }, [protein, carbs, fat, autoCalc]);

  // If user manually edits calories, stop auto-calculating
  const handleCaloriesChange = (val) => {
    setAutoCalc(false);
    setCalories(val);
  };

  // Reset auto-calc when macros are cleared
  const handleMacroChange = (setter) => (val) => {
    setAutoCalc(true);
    setter(val);
  };

  const isValid = name.trim() && calories;

  const handleLog = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await api.addMeal({
        name:     name.trim(),
        emoji,
        calories: parseFloat(calories) || 0,
        protein:  parseFloat(protein)  || 0,
        carbs:    parseFloat(carbs)    || 0,
        fat:      parseFloat(fat)      || 0,
      });
      if (result._id || result.id) {
        navigation.navigate('MainApp', { screen: 'Home' });
      } else {
        Alert.alert('Error', result.message || 'Could not log meal.');
      }
    } catch {
      Alert.alert('Connection error', 'Could not connect to server.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.back, { color: theme.accent }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Log Food Manually</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Enter the nutrition info from the label
            </Text>
          </View>

          {/* Emoji picker */}
          <View style={[styles.emojiSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.emojiHeader}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Food icon</Text>
              <TouchableOpacity onPress={() => setShowEmojis(!showEmojis)}>
                <Text style={[styles.emojiToggle, { color: theme.accent }]}>
                  {showEmojis ? 'Close' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedEmoji}>{emoji}</Text>
            {showEmojis && (
              <View style={styles.emojiGrid}>
                {QUICK_EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, emoji === e && { backgroundColor: theme.accentLight, borderRadius: 8 }]}
                    onPress={() => { setEmoji(e); setShowEmojis(false); }}
                  >
                    <Text style={styles.emojiOption}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Food name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Food name <Text style={{ color: theme.danger }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="e.g. Chicken breast"
              placeholderTextColor={theme.placeholder}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Nutrition grid */}
          <View style={[styles.macroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.macroCardTitle, { color: theme.text }]}>Nutrition info</Text>
            <Text style={[styles.macroCardSub, { color: theme.textSecondary }]}>
              Enter macros and calories will calculate automatically
            </Text>

            <View style={styles.macroGrid}>
              {/* Protein */}
              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#FF6B6B' }]}>Protein (g)</Text>
                <TextInput
                  style={[styles.macroField, { backgroundColor: theme.inputBg, borderColor: '#FF6B6B', color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  value={protein}
                  onChangeText={handleMacroChange(setProtein)}
                  keyboardType="numeric"
                />
              </View>

              {/* Carbs */}
              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#FFD93D' }]}>Carbs (g)</Text>
                <TextInput
                  style={[styles.macroField, { backgroundColor: theme.inputBg, borderColor: '#FFD93D', color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  value={carbs}
                  onChangeText={handleMacroChange(setCarbs)}
                  keyboardType="numeric"
                />
              </View>

              {/* Fat */}
              <View style={styles.macroInput}>
                <Text style={[styles.label, { color: '#6BCB77' }]}>Fat (g)</Text>
                <TextInput
                  style={[styles.macroField, { backgroundColor: theme.inputBg, borderColor: '#6BCB77', color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  value={fat}
                  onChangeText={handleMacroChange(setFat)}
                  keyboardType="numeric"
                />
              </View>

              {/* Calories — auto or manual */}
              <View style={styles.macroInput}>
                <View style={styles.calLabelRow}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Calories <Text style={{ color: theme.danger }}>*</Text>
                  </Text>
                  {!autoCalc && (
                    <TouchableOpacity onPress={() => setAutoCalc(true)}>
                      <Text style={[styles.resetLabel, { color: theme.accent }]}>Auto</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.macroField, {
                    backgroundColor: autoCalc ? theme.accentLight : theme.inputBg,
                    borderColor: autoCalc ? theme.accent : theme.inputBorder,
                    color: theme.text,
                  }]}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  value={calories}
                  onChangeText={handleCaloriesChange}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {autoCalc && (protein || carbs || fat) ? (
              <Text style={[styles.autoNote, { color: theme.textTertiary }]}>
                ⚡ Calories calculated using 4-4-9 rule. Tap calories to override.
              </Text>
            ) : null}
          </View>

          {/* Preview card */}
          {name.trim() && calories ? (
            <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.previewTitle, { color: theme.textSecondary }]}>Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewEmoji}>{emoji}</Text>
                <View style={styles.previewInfo}>
                  <Text style={[styles.previewName, { color: theme.text }]}>{name}</Text>
                  <Text style={[styles.previewMacros, { color: theme.textSecondary }]}>
                    P: {protein || 0}g  C: {carbs || 0}g  F: {fat || 0}g
                  </Text>
                </View>
                <View style={[styles.calBadge, { backgroundColor: theme.accentLight }]}>
                  <Text style={[styles.calBadgeText, { color: theme.accent }]}>{calories} cal</Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Log button */}
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: theme.accent, opacity: isValid ? 1 : 0.4 }]}
            onPress={handleLog}
            disabled={!isValid || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.logBtnText}>Log Food ✓</Text>
            }
          </TouchableOpacity>

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
  scroll: { padding: 24, gap: 20, paddingBottom: 40 },
  header: { gap: 6 },
  back: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  emojiSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  emojiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emojiToggle: { fontSize: 13, fontWeight: '600' },
  selectedEmoji: { fontSize: 40, textAlign: 'center' },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  emojiBtn: { padding: 6 },
  emojiOption: { fontSize: 26 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  macroCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  macroCardTitle: { fontSize: 15, fontWeight: '700' },
  macroCardSub: { fontSize: 12, marginTop: -6 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroInput: { width: '47%', gap: 6 },
  macroField: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 16, fontWeight: '600' },
  calLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resetLabel: { fontSize: 11, fontWeight: '600' },
  autoNote: { fontSize: 11, marginTop: -4 },
  previewCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  previewTitle: { fontSize: 12, fontWeight: '500' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewEmoji: { fontSize: 28 },
  previewInfo: { flex: 1, gap: 2 },
  previewName: { fontSize: 14, fontWeight: '600' },
  previewMacros: { fontSize: 12 },
  calBadge: { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 10 },
  calBadgeText: { fontSize: 13, fontWeight: '600' },
  logBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', fontSize: 14 },
});