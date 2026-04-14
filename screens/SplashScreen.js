import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export default function SplashScreen({ navigation, theme }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setTimeout(() => navigation.replace('Login'), 1800);
          return;
        }

        // Verify token is still valid and user still exists
        const result = await api.verify();
        if (result && result.user) {
          // Update stored user data with fresh data
          await AsyncStorage.setItem('user', JSON.stringify(result.user));
          setTimeout(() => navigation.replace('Welcome', {
            username: result.user.displayName || result.user.username,
            returningUser: true,
          }), 1800);
        } else {
          // Token invalid or user deleted — clear and go to login
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          setTimeout(() => navigation.replace('Login'), 1800);
        }
      } catch {
        setTimeout(() => navigation.replace('Login'), 1800);
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <View style={[styles.logoBox, { backgroundColor: theme.accent }]}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={[styles.appName, { color: theme.text }]}>CalAI</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>Nutrition, powered by AI</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12 },
  logoBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: 16, fontWeight: '400' },
});
