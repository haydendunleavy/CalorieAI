import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView } from 'react-native';

export default function OnboardingActivity({ navigation, route, theme }) {
  const params = route.params;
  const [selected, setSelected] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const levels = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little or no exercise, desk job', icon: '🛋️', multiplier: '×1.2' },
    { id: 'light', label: 'Lightly active', description: 'Light exercise 1-3 days/week', icon: '🚶', multiplier: '×1.375' },
    { id: 'moderate', label: 'Moderately active', description: 'Moderate exercise 3-5 days/week', icon: '🏃', multiplier: '×1.55' },
    { id: 'active', label: 'Very active', description: 'Hard exercise 6-7 days/week', icon: '💪', multiplier: '×1.725' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 3 ? theme.accent : theme.border, width: i === 3 ? 24 : 8 }]} />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={[styles.step, { color: theme.textTertiary }]}>Step 3 of 5</Text>
          <Text style={[styles.title, { color: theme.text }]}>Activity level</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>This adjusts your calorie needs significantly</Text>
        </View>

        <View style={styles.options}>
          {levels.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[styles.option, { backgroundColor: selected === l.id ? theme.accentLight : theme.surface, borderColor: selected === l.id ? theme.accent : theme.border }]}
              onPress={() => setSelected(l.id)}
            >
              <Text style={styles.icon}>{l.icon}</Text>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>{l.label}</Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{l.description}</Text>
              </View>
              <Text style={[styles.multiplier, { color: selected === l.id ? theme.accent : theme.textTertiary }]}>{l.multiplier}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: selected ? theme.accent : theme.border }]}
          onPress={() => selected && navigation.navigate('OnboardingGoal', { ...params, activityLevel: selected })}
          disabled={!selected}
        >
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', gap: 28 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  header: { gap: 8 },
  step: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  options: { gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1.5 },
  icon: { fontSize: 24 },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  optionDesc: { fontSize: 12 },
  multiplier: { fontSize: 13, fontWeight: '600' },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
