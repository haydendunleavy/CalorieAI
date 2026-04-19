import React, { useState, useEffect } from 'react';
import { useColorScheme, View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { lightTheme, darkTheme } from './theme';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OnboardingGender from './screens/OnboardingGender';
import OnboardingStats from './screens/OnboardingStats';
import OnboardingActivity from './screens/OnboardingActivity';
import OnboardingGoal from './screens/OnboardingGoal';
import OnboardingCalories from './screens/OnboardingCalories';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import ScannerScreen from './screens/ScannerScreen';
import PortionScreen from './screens/PortionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function ProfileScreen({ theme, toggleTheme, navigation }) {
  const handleSignOut = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    navigation.getParent()?.replace('Login');
  };

  return (
    <SafeAreaView style={[styles.profileContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.profileTitle, { color: theme.text }]}>👤 Profile</Text>
      <Text style={[styles.profileSub, { color: theme.textSecondary }]}>Settings coming soon</Text>

      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={toggleTheme}
      >
        <Text style={[styles.themeToggleText, { color: theme.text }]}>
          {theme === lightTheme ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: theme.danger }]}
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PlaceholderScreen({ title, theme }) {
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.background }]}>
      <Text style={[styles.placeholderText, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.placeholderSub, { color: theme.textSecondary }]}>Coming soon</Text>
    </View>
  );
}

function MainApp({ theme, toggleTheme, navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      >
        {/* FIX: pass navigation properly */}
        {(props) => <HomeScreen {...props} theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Log Food"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>➕</Text> }}
      >
        {() => <PlaceholderScreen title="➕ Log Food" theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="AI Scan"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text> }}
      >
        {() => <PlaceholderScreen title="📷 AI Scan" theme={theme} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text> }}
      >
        {(props) => <ProfileScreen {...props} theme={theme} toggleTheme={toggleTheme} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemTheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('themePreference');
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else {
          setIsDark(systemTheme === 'dark');
        }
      } catch {
        setIsDark(systemTheme === 'dark');
      }
      setThemeLoaded(true);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('themePreference', newVal ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  if (!themeLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">{props => <SplashScreen {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="Login">{props => <LoginScreen {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="Signup">{props => <SignupScreen {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="OnboardingGender">{props => <OnboardingGender {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="OnboardingStats">{props => <OnboardingStats {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="OnboardingActivity">{props => <OnboardingActivity {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="OnboardingGoal">{props => <OnboardingGoal {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="OnboardingCalories">{props => <OnboardingCalories {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="Welcome">{props => <WelcomeScreen {...props} theme={theme} />}</Stack.Screen>
        <Stack.Screen name="PortionScreen">{props => <PortionScreen {...props} theme={theme} />}</Stack.Screen>


        <Stack.Screen name="MainApp">
          {props => <MainApp {...props} theme={theme} toggleTheme={toggleTheme} />}
        </Stack.Screen>

        {/* Scanner stays exactly as you had it */}
        <Stack.Screen name="Scanner">
          {props => <ScannerScreen {...props} theme={theme} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  placeholderText: { fontSize: 24, fontWeight: '700' },
  placeholderSub: { fontSize: 15 },
  profileContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  profileTitle: { fontSize: 28, fontWeight: '700' },
  profileSub: { fontSize: 15 },
  themeToggle: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  themeToggleText: { fontSize: 15, fontWeight: '500' },
  signOutButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8 },
  signOutText: { fontSize: 15, fontWeight: '600' },
});