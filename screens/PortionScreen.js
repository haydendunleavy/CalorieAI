import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from "react-native";

export default function PortionScreen({ route, navigation, theme }) {
  const {
    name,
    brand,
    caloriesPer100,
    proteinPer100,
    carbsPer100,
    fatPer100,
    per,
    isDrink,   // <-- now correctly received
  } = route.params;

  const [amountInput, setAmountInput] = useState("");

  // amount = grams or ml depending on isDrink
  const amount = parseFloat(amountInput) || 0;

  // live macro calculations
  const calories = Math.round((caloriesPer100 / 100) * amount);
  const protein = Math.round((proteinPer100 / 100) * amount);
  const carbs = Math.round((carbsPer100 / 100) * amount);
  const fat = Math.round((fatPer100 / 100) * amount);

  const handleLog = () => {
    if (amount <= 0) return;

    navigation.navigate("MainTabs", {
      screen: "HomeScreen",
      params: {
        loggedFood: {
          name,
          brand,
          amount,
          calories,
          protein,
          carbs,
          fat,
          isDrink,
          timestamp: Date.now(),
        },
      },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>

        <Text style={[styles.title, { color: theme.text }]}>How much did you consume?</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{name}</Text>

        <TextInput
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.textSecondary }
          ]}
          placeholder={`Enter amount in ${isDrink ? "ml" : "g"}`}
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          value={amountInput}
          onChangeText={setAmountInput}
        />

        {/* Macro Card */}
        <View style={[styles.macroRow, { backgroundColor: theme.card }]}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: theme.text }]}>{calories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: "#FF6B6B" }]}>{protein}{isDrink ? "ml" : "g"}</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: "#FFD93D" }]}>{carbs}{isDrink ? "ml" : "g"}</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>

          <View style={styles.macroDivider} />

          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: "#6BCB77" }]}>{fat}{isDrink ? "ml" : "g"}</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        <Text style={[styles.perText, { color: theme.textSecondary }]}>
            Per {amount > 0 ? `${amount}${isDrink ? "ml" : "g"}` : per}
    </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.accent, opacity: amount > 0 ? 1 : 0.4 }]}
          disabled={amount <= 0}
          onPress={handleLog}
        >
          <Text style={styles.buttonText}>Log Portion ✓</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancel, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 20 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 16 },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    fontSize: 18,
  },
  macroRow: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
    alignItems: "center",
  },
  macroItem: { alignItems: "center", gap: 4 },
  macroValue: { fontSize: 20, fontWeight: "800" },
  macroLabel: { fontSize: 11, color: "#64748b" },
  macroDivider: { width: 1, height: 32, backgroundColor: "#e2e8f0" },
  perText: { textAlign: "center", fontSize: 14, marginTop: -10 },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancel: { textAlign: "center", marginTop: 8 },
});
