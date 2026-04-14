import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export default function WelcomeScreen({ navigation, route, theme }) {
  const { username, returningUser } = route.params;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        navigation.replace('MainApp');
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.wave}>👋</Text>
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {returningUser ? 'Welcome back' : 'Welcome'}
        </Text>
        <Text style={[styles.username, { color: theme.text }]}>{username}</Text>
        <Text style={[styles.tagline, { color: theme.accent }]}>
          {returningUser ? 'Great to see you again!' : "Let's crush your goals today 🚀"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 8 },
  wave: { fontSize: 56, marginBottom: 8 },
  label: { fontSize: 18, fontWeight: '400' },
  username: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  tagline: { fontSize: 15, fontWeight: '500', marginTop: 4 },
});
