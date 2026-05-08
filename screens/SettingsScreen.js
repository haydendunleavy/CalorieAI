import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';

const MACRO_COLORS = {
  protein: ['#FF6B6B', '#FF4444', '#FF9999', '#E84393', '#FF6B35'],
  carbs:   ['#FFD93D', '#FFA500', '#FFE066', '#F4C430', '#FFCC00'],
  fat:     ['#6BCB77', '#4CAF50', '#95D5A0', '#00BCD4', '#66BB6A'],
};

function ColorPicker({ colors, selected, onSelect, theme }) {
  return (
    <View style={styles.colorRow}>
      {colors.map(c => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={[
            styles.colorDot,
            { backgroundColor: c },
            selected === c && styles.colorDotSelected,
          ]}
        />
      ))}
    </View>
  );
}

function SettingRow({ label, sub, right, theme }) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
      <View style={styles.settingLeft}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {sub ? <Text style={[styles.settingSub, { color: theme.textSecondary }]}>{sub}</Text> : null}
      </View>
      <View style={styles.settingRight}>{right}</View>
    </View>
  );
}

export default function SettingsScreen({ theme, toggleTheme, navigation }) {
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [nickname, setNickname]           = useState('');
  const [calorieGoal, setCalorieGoal]     = useState('');
  const [proteinGoal, setProteinGoal]     = useState('');
  const [carbsGoal, setCarbsGoal]         = useState('');
  const [fatGoal, setFatGoal]             = useState('');
  const [proteinColor, setProteinColor]   = useState('#FF6B6B');
  const [carbsColor, setCarbsColor]       = useState('#FFD93D');
  const [fatColor, setFatColor]           = useState('#6BCB77');
  const [unit, setUnit]                   = useState('metric');
  const [notifications, setNotifications] = useState(true);
  const isDark = theme.background === '#0f172a';

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setNickname(u.nickname || '');
      setCalorieGoal(String(u.calorieGoal || 2000));
      setProteinGoal(String(u.proteinGoal || 150));
      setCarbsGoal(String(u.carbsGoal || 200));
      setFatGoal(String(u.fatGoal || 65));
      setUnit(u.unit || 'metric');
    }
    const savedProtein = await AsyncStorage.getItem('colorProtein');
    const savedCarbs   = await AsyncStorage.getItem('colorCarbs');
    const savedFat     = await AsyncStorage.getItem('colorFat');
    const savedNotifs  = await AsyncStorage.getItem('notifications');
    if (savedProtein) setProteinColor(savedProtein);
    if (savedCarbs)   setCarbsColor(savedCarbs);
    if (savedFat)     setFatColor(savedFat);
    if (savedNotifs !== null) setNotifications(savedNotifs === 'true');
  };

  useFocusEffect(useCallback(() => { loadUser(); }, []));

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = {
        ...user,
        nickname,
        calorieGoal: parseInt(calorieGoal) || 2000,
        proteinGoal: parseInt(proteinGoal) || 150,
        carbsGoal:   parseInt(carbsGoal)   || 200,
        fatGoal:     parseInt(fatGoal)     || 65,
        unit,
      };
      await AsyncStorage.setItem('user', JSON.stringify(updated));
      await AsyncStorage.setItem('colorProtein', proteinColor);
      await AsyncStorage.setItem('colorCarbs',   carbsColor);
      await AsyncStorage.setItem('colorFat',     fatColor);
      await AsyncStorage.setItem('notifications', String(notifications));
      setUser(updated);
      Alert.alert('Saved! ✓', 'Your settings have been updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save settings.');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          navigation.getParent()?.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* ── Profile ── */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROFILE</Text>

          <SettingRow
            label="Nickname"
            sub="Shown as your display name"
            theme={theme}
            right={
              <TextInput
                style={[styles.inlineInput, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                value={nickname}
                onChangeText={setNickname}
                placeholder="e.g. HyDrate"
                placeholderTextColor={theme.placeholder}
              />
            }
          />

          <SettingRow
            label="Units"
            sub="Metric (kg/cm) or Imperial (lbs/ft)"
            theme={theme}
            right={
              <View style={[styles.miniToggle, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <TouchableOpacity
                  style={[styles.miniToggleBtn, unit === 'metric' && { backgroundColor: theme.accent }]}
                  onPress={() => setUnit('metric')}
                >
                  <Text style={[styles.miniToggleText, { color: unit === 'metric' ? '#fff' : theme.textSecondary }]}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniToggleBtn, unit === 'imperial' && { backgroundColor: theme.accent }]}
                  onPress={() => setUnit('imperial')}
                >
                  <Text style={[styles.miniToggleText, { color: unit === 'imperial' ? '#fff' : theme.textSecondary }]}>lbs</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>

        {/* ── Goals ── */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DAILY GOALS</Text>

          {[
            { label: 'Calories', value: calorieGoal, set: setCalorieGoal, unit: 'kcal' },
            { label: 'Protein',  value: proteinGoal, set: setProteinGoal, unit: 'g' },
            { label: 'Carbs',    value: carbsGoal,   set: setCarbsGoal,   unit: 'g' },
            { label: 'Fat',      value: fatGoal,     set: setFatGoal,     unit: 'g' },
          ].map(item => (
            <SettingRow
              key={item.label}
              label={item.label}
              theme={theme}
              right={
                <View style={styles.goalInputRow}>
                  <TextInput
                    style={[styles.goalInput, { color: theme.text, borderColor: theme.inputBorder, backgroundColor: theme.inputBg }]}
                    value={item.value}
                    onChangeText={item.set}
                    keyboardType="numeric"
                    placeholderTextColor={theme.placeholder}
                  />
                  <Text style={[styles.goalUnit, { color: theme.textTertiary }]}>{item.unit}</Text>
                </View>
              }
            />
          ))}
        </View>

        {/* ── Macro colours ── */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MACRO COLOURS</Text>

          <SettingRow
            label="Protein"
            theme={theme}
            right={<ColorPicker colors={MACRO_COLORS.protein} selected={proteinColor} onSelect={setProteinColor} theme={theme} />}
          />
          <SettingRow
            label="Carbs"
            theme={theme}
            right={<ColorPicker colors={MACRO_COLORS.carbs} selected={carbsColor} onSelect={setCarbsColor} theme={theme} />}
          />
          <SettingRow
            label="Fat"
            theme={theme}
            right={<ColorPicker colors={MACRO_COLORS.fat} selected={fatColor} onSelect={setFatColor} theme={theme} />}
          />
        </View>

        {/* ── Appearance ── */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>

          <SettingRow
            label="Dark Mode"
            sub="Switch between light and dark"
            theme={theme}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#fff"
              />
            }
          />

          <SettingRow
            label="Notifications"
            sub="Daily reminders to log meals"
            theme={theme}
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes ✓</Text>
          }
        </TouchableOpacity>

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: theme.danger }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textTertiary }]}>Macroly v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },

  section: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, gap: 12,
  },
  settingLeft: { flex: 1, gap: 2 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  settingSub: { fontSize: 12 },
  settingRight: { alignItems: 'flex-end' },

  inlineInput: {
    height: 36, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, fontSize: 14, minWidth: 120, textAlign: 'right',
  },

  miniToggle: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1,
    padding: 3, gap: 2,
  },
  miniToggleBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 7 },
  miniToggleText: { fontSize: 13, fontWeight: '600' },

  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalInput: {
    height: 36, width: 80, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, fontSize: 14, textAlign: 'right', fontWeight: '600',
  },
  goalUnit: { fontSize: 12, width: 28 },

  colorRow: { flexDirection: 'row', gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  colorDotSelected: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 4,
  },

  saveBtn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  signOutBtn: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  signOutText: { fontSize: 16, fontWeight: '600' },
  version: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});