import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';

export default function OnboardingStats({ navigation, route, theme }) {
  const params = route.params;
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState('metric');
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!age) newErrors.age = 'Age is required';
    else if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) newErrors.age = 'Please enter a valid age (13-100)';

    if (!weight) newErrors.weight = 'Weight is required';
    else if (unit === 'metric' && (isNaN(weightNum) || weightNum < 30 || weightNum > 300))
      newErrors.weight = 'Enter a valid weight (30-300 kg)';
    else if (unit === 'imperial' && (isNaN(weightNum) || weightNum < 66 || weightNum > 660))
      newErrors.weight = 'Enter a valid weight (66-660 lbs)';

    if (!height) newErrors.height = 'Height is required';
    else if (unit === 'metric' && (isNaN(heightNum) || heightNum < 100 || heightNum > 250))
      newErrors.height = 'Enter a valid height (100-250 cm)';
    else if (unit === 'imperial' && (isNaN(heightNum) || heightNum < 3 || heightNum > 8))
      newErrors.height = 'Enter a valid height (3-8 ft)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={styles.progressRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: i <= 2 ? theme.accent : theme.border, width: i === 2 ? 24 : 8 }]} />
              ))}
            </View>

            <View style={styles.header}>
              <Text style={[styles.step, { color: theme.textTertiary }]}>Step 2 of 5</Text>
              <Text style={[styles.title, { color: theme.text }]}>Your body stats</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Used to calculate your personalised calories</Text>
            </View>

            <View style={[styles.toggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity style={[styles.toggleBtn, unit === 'metric' && { backgroundColor: theme.accent }]} onPress={() => setUnit('metric')}>
                <Text style={[styles.toggleText, { color: unit === 'metric' ? '#fff' : theme.textSecondary }]}>Metric</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, unit === 'imperial' && { backgroundColor: theme.accent }]} onPress={() => setUnit('imperial')}>
                <Text style={[styles.toggleText, { color: unit === 'imperial' ? '#fff' : theme.textSecondary }]}>Imperial</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.age ? theme.danger : theme.inputBorder, color: theme.text }]}
                  placeholder="e.g. 25"
                  placeholderTextColor={theme.placeholder}
                  value={age}
                  onChangeText={(t) => { setAge(t); setErrors(e => ({ ...e, age: null })); }}
                  keyboardType="numeric"
                />
                {errors.age && <Text style={[styles.error, { color: theme.danger }]}>{errors.age}</Text>}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Weight ({unit === 'metric' ? 'kg' : 'lbs'})</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.weight ? theme.danger : theme.inputBorder, color: theme.text }]}
                    placeholder={unit === 'metric' ? 'e.g. 70' : 'e.g. 154'}
                    placeholderTextColor={theme.placeholder}
                    value={weight}
                    onChangeText={(t) => { setWeight(t); setErrors(e => ({ ...e, weight: null })); }}
                    keyboardType="numeric"
                  />
                  {errors.weight && <Text style={[styles.error, { color: theme.danger }]}>{errors.weight}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Height ({unit === 'metric' ? 'cm' : 'ft'})</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.height ? theme.danger : theme.inputBorder, color: theme.text }]}
                    placeholder={unit === 'metric' ? 'e.g. 175' : 'e.g. 5.9'}
                    placeholderTextColor={theme.placeholder}
                    value={height}
                    onChangeText={(t) => { setHeight(t); setErrors(e => ({ ...e, height: null })); }}
                    keyboardType="numeric"
                  />
                  {errors.height && <Text style={[styles.error, { color: theme.danger }]}>{errors.height}</Text>}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.accent }]}
              onPress={() => validate() && navigation.navigate('OnboardingActivity', { ...params, age, weight, height, unit })}
            >
              <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  content: { gap: 28 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  header: { gap: 8 },
  step: { fontSize: 13, fontWeight: '500' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  toggle: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  error: { fontSize: 12, marginTop: 2 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
