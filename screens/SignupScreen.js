import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';

export default function SignupScreen({ navigation, theme }) {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [contactType, setContactType] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (!username.trim()) newErrors.username = 'Username is required';
    else if (username.trim().length < 3) newErrors.username = 'Must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = 'Only letters, numbers and underscores';

    if (contactType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) newErrors.contact = 'Email is required';
      else if (!emailRegex.test(email)) newErrors.contact = 'Please enter a valid email address';
    } else {
      const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
      if (!phone.trim()) newErrors.contact = 'Phone number is required';
      else if (!phoneRegex.test(phone)) newErrors.contact = 'Please enter a valid phone number';
    }

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Must be at least 8 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    navigation.navigate('OnboardingGender', {
      username: username.trim().toLowerCase(),
      nickname: nickname.trim(),
      email: contactType === 'email' ? email.trim() : '',
      phone: contactType === 'phone' ? phone.trim() : '',
      password,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Start your nutrition journey</Text>
            </View>

            <View style={styles.form}>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Username <Text style={{ color: theme.textTertiary }}>(unique, used to sign in)</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.username ? theme.danger : theme.inputBorder, color: theme.text }]}
                  placeholder="e.g. hydrate_99"
                  placeholderTextColor={theme.placeholder}
                  value={username}
                  onChangeText={(t) => { setUsername(t); setErrors(e => ({ ...e, username: null })); }}
                  autoCapitalize="none"
                />
                {errors.username && <Text style={[styles.error, { color: theme.danger }]}>{errors.username}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Nickname <Text style={{ color: theme.textTertiary }}>(optional — shown in app)</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                  placeholder="e.g. HyDrate"
                  placeholderTextColor={theme.placeholder}
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Sign up with</Text>
                <View style={[styles.toggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, contactType === 'email' && { backgroundColor: theme.accent }]}
                    onPress={() => setContactType('email')}
                  >
                    <Text style={[styles.toggleText, { color: contactType === 'email' ? '#fff' : theme.textSecondary }]}>Email</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, contactType === 'phone' && { backgroundColor: theme.accent }]}
                    onPress={() => setContactType('phone')}
                  >
                    <Text style={[styles.toggleText, { color: contactType === 'phone' ? '#fff' : theme.textSecondary }]}>Phone</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {contactType === 'email' ? (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Email address</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.contact ? theme.danger : theme.inputBorder, color: theme.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.placeholder}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, contact: null })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.contact && <Text style={[styles.error, { color: theme.danger }]}>{errors.contact}</Text>}
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Phone number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: errors.contact ? theme.danger : theme.inputBorder, color: theme.text }]}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor={theme.placeholder}
                    value={phone}
                    onChangeText={(t) => { setPhone(t); setErrors(e => ({ ...e, contact: null })); }}
                    keyboardType="phone-pad"
                  />
                  {errors.contact && <Text style={[styles.error, { color: theme.danger }]}>{errors.contact}</Text>}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                <View style={[styles.passwordContainer, { backgroundColor: theme.inputBg, borderColor: errors.password ? theme.danger : theme.inputBorder }]}>
                  <TextInput
                    style={[styles.passwordInput, { color: theme.text }]}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={theme.placeholder}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: null })); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text style={[styles.showHide, { color: theme.accent }]}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={[styles.error, { color: theme.danger }]}>{errors.password}</Text>}
              </View>

              <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={handleContinue}>
                <Text style={styles.buttonText}>Continue →</Text>
              </TouchableOpacity>

              <Text style={[styles.terms, { color: theme.textTertiary }]}>
                By continuing you agree to our Terms of Service and Privacy Policy
              </Text>
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
  content: { gap: 28 },
  header: { gap: 8 },
  backText: { fontSize: 15, fontWeight: '500', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
  toggle: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  passwordContainer: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, fontSize: 15 },
  showHide: { fontSize: 13, fontWeight: '500' },
  error: { fontSize: 12, marginTop: 2 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
