import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Keyboard, TouchableWithoutFeedback, ActivityIndicator, Alert,
} from "react-native";
import api from "../api";

export default function PortionScreen({ route, navigation, theme }) {
  const {
    name,
    brand,
    caloriesPer100,
    proteinPer100,
    carbsPer100,
    fatPer100,
    per,
    isDrink,
  } = route.params;

  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);

  const amount = parseFloat(amountInput) || 0;
  const unit = isDrink ? "ml" : "g";

  // Live macro calculations
  const calories = Math.round(((caloriesPer100 / 100) * amount).toFixed(1));
  const protein  = parseFloat(((proteinPer100  / 100) * amount).toFixed(1));
  const carbs    = parseFloat(((carbsPer100    / 100) * amount).toFixed(1));
  const fat      = parseFloat(((fatPer100      / 100) * amount).toFixed(1));

  const handleLog = async () => {
    if (amount <= 0) return;
    setLoading(true);

    try {
      const result = await api.addMeal({
        name: `${name}${brand ? ` (${brand})` : ''}`,
        emoji: isDrink ? '🥤' : '🍽️',
        calories,
        protein,
        carbs,
        fat,
        amount,
        unit,
        isDrink,
      });

      if (result._id || result.id) {
        // Success — go back to home
        navigation.navigate("MainApp", { screen: "Home" });
      } else {
        Alert.alert('Error', result.message || 'Could not log meal. Please try again.');
      }
    } catch (err) {
      Alert.alert('Connection error', 'Could not connect to server. Make sure your backend is running.');
    }

    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isDrink ? '🥤' : '🍽️'} How much did you have?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{name}</Text>
          {brand ? <Text style={[styles.brand, { color: theme.textTertiary }]}>{brand}</Text> : null}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, {
              color: theme.text,
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBg,
              flex: 1,
            }]}
            placeholder={isDrink ? "e.g. 250" : "e.g. 150"}
            placeholderTextColor={theme.placeholder}
            keyboardType="numeric"
            value={amountInput}
            onChangeText={setAmountInput}
          />
          <View style={[styles.unitBadge, { backgroundColor: theme.accentLight }]}>
            <Text style={[styles.unitText, { color: theme.accent }]}>{unit}</Text>
          </View>
        </View>

        <Text style={[styles.perText, { color: theme.textTertiary }]}>
          Based on {per} nutrition data
        </Text>

        <View style={[styles.macroRow, { backgroundColor: theme.surface, borderColor: theme.cardBorder, borderWidth: 1 }]}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: theme.text }]}>{calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#FF6B6B' }]}>{protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#FFD93D' }]}>{carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#6BCB77' }]}>{fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        {amount > 0 && (
          <Text style={[styles.summary, { color: theme.textSecondary }]}>
            Logging {amount}{unit} of {name}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: theme.accent,
            opacity: amount > 0 ? 1 : 0.4,
          }]}
          disabled={amount <= 0 || loading}
          onPress={handleLog}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Log {isDrink ? 'Drink' : 'Food'} ✓</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 16 },
  brand: { fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    borderWidth: 1, padding: 14,
    borderRadius: 12, fontSize: 20, fontWeight: '600',
  },
  unitBadge: {
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  unitText: { fontSize: 16, fontWeight: '700' },
  perText: { fontSize: 12, marginTop: -4 },
  macroRow: {
    flexDirection: 'row', borderRadius: 16,
    padding: 16, justifyContent: 'space-around', alignItems: 'center',
  },
  macroItem: { alignItems: 'center', gap: 4 },
  macroValue: { fontSize: 20, fontWeight: '800' },
  macroLabel: { fontSize: 11, color: '#64748b' },
  macroDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },
  summary: { fontSize: 14, textAlign: 'center' },
  button: { padding: 16, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { textAlign: 'center', marginTop: 4, fontSize: 14 },
});