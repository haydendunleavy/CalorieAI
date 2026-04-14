import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView } from 'react-native';

export default function OnboardingGoal({ navigation, route, theme }) {
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

  const goals = [
    { id: 'cut', label: 'Cutting', description: 'Lose body fat while preserving muscle', icon: '🔥', modifier: -400 },
    { id: 'maintain', label: 'Maintaining', description: 'Stay at your current weight', icon: '⚖️', modifier: 0 },
    { id: 'bulk', label: 'Bulking', description: 'Build muscle and gain size', icon: '💪', modifier: +400 },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= 4 ? theme.accent : theme.border, width: i === 4 ? 24 : 8 }]} />
          ))}
        </View>

        <View style={styles.header}>
          <Text style={[styles.step, { color: theme.textTertiary }]}>Step 4 of 5</Text>
          <Text style={[styles.title, { color: theme.text }]}>What's your goal?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>We'll adjust your calorie target based on this</Text>
        </View>

        <View style={styles.options}>
          {goals.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.option, { backgroundColor: selected === g.id ? theme.accentLight : theme.surface, borderColor: selected === g.id ? theme.accent : theme.border }]}
              onPress={() => setSelected(g.id)}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.icon}>{g.icon}</Text>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{g.label}</Text>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{g.description}</Text>
                </View>
              </View>
              {selected === g.id && <View style={[styles.check, { backgroundColor: theme.accent }]}><Text style={styles.checkText}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: selected ? theme.accent : theme.border }]}
          onPress={() => {
            if (selected) {
              const goal = goals.find(g => g.id === selected);
              navigation.navigate('OnboardingCalories', { ...params, goal: selected, modifier: goal.modifier });
            }
          }}
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
  content: { flex: 1, padding: 24, justifyContent: 'center', gap: 32 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  header: { gap: 8 },
  step: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, borderWidth: 1.5 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  icon: { fontSize: 28 },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  optionDesc: { fontSize: 13 },
  check: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
