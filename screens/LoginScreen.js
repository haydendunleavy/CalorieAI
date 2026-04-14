import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  SafeAreaView, ActivityIndicator, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const QUOTES = [
  "Every meal is a chance to nourish your body. 💪",
  "Small steps every day lead to big results. 🚀",
  "You don't have to be perfect, just consistent. ⚡",
  "Your body is a reflection of your lifestyle. 🌟",
  "Fuel your ambition, one meal at a time. 🔥",
  "Progress, not perfection. Keep going. 💯",
  "Great things never come from comfort zones. 🏆",
  "Believe in yourself and your journey. ✨",
];

export default function LoginScreen({ navigation, theme }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
    if (!identifier.trim()) newErrors.identifier = 'Email or phone number is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const data = await api.login(identifier.trim(), password);
      if (data.token) {
        if (stayLoggedIn) {
          await AsyncStorage.setItem('token', data.token);
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        navigation.replace('Welcome', {
          username: data.user.displayName || data.user.username,
          returningUser: true,
        });
      } else {
        setServerError(data.message || 'Invalid credentials');
      }
    } catch {
      setServerError('Could not connect to server. Please check your connection.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={styles.header}>
              <View style={[styles.logoBox, { backgroundColor: theme.accent }]}>
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
              <Text style={[styles.quote, { color: theme.textSecondary }]}>{quote}</Text>
            </View>

            <View style={styles.form}>
              {serverError ? (
                <View style={[styles.serverError, { backgroundColor: '#fee2e2', borderColor: theme.danger }]}>
                  <Text style={[styles.serverErrorText, { color: theme.danger }]}>{serverError}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Email or phone number</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: theme.inputBg,
                    borderColor: errors.identifier ? theme.danger : theme.inputBorder,
                    color: theme.text,
                  }]}
                  placeholder="you@example.com or +1234567890"
                  placeholderTextColor={theme.placeholder}
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); setErrors(e => ({ ...e, identifier: null })); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errors.identifier && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.identifier}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                <View style={[styles.passwordContainer, {
                  backgroundColor: theme.inputBg,
                  borderColor: errors.password ? theme.danger : theme.inputBorder,
                }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={[styles.showHide, { color: theme.accent }]}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={[styles.errorText, { color: theme.danger }]}>{errors.password}</Text>}
              </View>

              <View style={styles.stayRow}>
                <Text style={[styles.stayText, { color: theme.textSecondary }]}>Stay logged in</Text>
                <Switch
                  value={stayLoggedIn}
                  onValueChange={setStayLoggedIn}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.outlineButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => navigation.navigate('Signup')}
              >
                <Text style={[styles.outlineButtonText, { color: theme.text }]}>Create an account</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  content: { gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  logoBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoIcon: { fontSize: 30 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  quote: { fontSize: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20, paddingHorizontal: 20 },
  form: { gap: 16 },
  serverError: { padding: 12, borderRadius: 10, borderWidth: 1 },
  serverErrorText: { fontSize: 13, textAlign: 'center' },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  passwordContainer: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, fontSize: 15 },
  showHide: { fontSize: 13, fontWeight: '500' },
  errorText: { fontSize: 12, marginTop: 2 },
  stayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stayText: { fontSize: 14, fontWeight: '500' },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  outlineButton: { height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outlineButtonText: { fontSize: 16, fontWeight: '600' },
});
