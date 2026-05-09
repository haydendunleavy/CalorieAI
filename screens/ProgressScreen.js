import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 160;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Bar chart (calories) ─────────────────────────────────────────────────────
function BarChart({ data, maxVal, color, goalVal, theme }) {
  if (!data || data.length === 0) return null;
  const barWidth = Math.floor((CHART_WIDTH / data.length) - 10);
  const trackHeight = CHART_HEIGHT - 40;

  return (
    <View style={{ height: CHART_HEIGHT, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: trackHeight, paddingBottom: 0 }}>
        {data.map((item, i) => {
          const pct = maxVal > 0 ? Math.min(item.value / maxVal, 1) : 0;
          const barH = Math.max(pct * trackHeight, item.value > 0 ? 4 : 0);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: trackHeight }}>
              {item.value > 0 && (
                <Text style={{ fontSize: 8, color: theme.textTertiary, marginBottom: 2 }}>
                  {item.value}
                </Text>
              )}
              <View style={{
                width: barWidth,
                height: barH,
                backgroundColor: item.isToday ? color : color + '55',
                borderRadius: 6,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: item.isToday ? 0.6 : 0.2,
                shadowRadius: item.isToday ? 8 : 3,
              }} />
            </View>
          );
        })}
      </View>
      {/* Day labels */}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {data.map((item, i) => (
          <Text key={i} style={{
            flex: 1, textAlign: 'center', fontSize: 10,
            color: item.isToday ? theme.text : theme.textTertiary,
            fontWeight: item.isToday ? '700' : '400',
          }}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Line chart (weight) ──────────────────────────────────────────────────────
function WeightLineChart({ data, color, theme }) {
  if (!data || data.length < 2) {
    return (
      <View style={{ height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.textTertiary, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
          Log at least 2 weigh-ins{'\n'}to see your trend
        </Text>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range  = maxVal - minVal || 1;
  const padTop = 16;
  const padBottom = 28;
  const plotH = CHART_HEIGHT - padTop - padBottom;

  const pts = data.map((d, i) => ({
    x: data.length === 1 ? CHART_WIDTH / 2 : (i / (data.length - 1)) * CHART_WIDTH,
    y: padTop + plotH - ((d.value - minVal) / range) * plotH,
    ...d,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <View style={{ height: CHART_HEIGHT, marginTop: 8 }}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Goal line - not applicable for weight, show min/max */}
        <Line
          x1={0} y1={padTop}
          x2={CHART_WIDTH} y2={padTop}
          stroke={theme.border} strokeWidth={1} strokeDasharray="4,4"
        />
        <SvgText x={4} y={padTop - 3} fontSize={8} fill={theme.textTertiary}>
          {maxVal}kg
        </SvgText>

        {/* Line */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color}
            stroke={theme.surface} strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {pts.map((p, i) => (
          <SvgText
            key={i}
            x={p.x}
            y={CHART_HEIGHT - 4}
            fontSize={9}
            fill={theme.textTertiary}
            textAnchor="middle"
          >
            {p.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

export default function ProgressScreen({ theme }) {
  const [weightHistory, setWeightHistory] = useState([]);
  const [newWeight, setNewWeight]         = useState('');
  const [user, setUser]                   = useState(null);
  const [activeTab, setActiveTab]         = useState('calories');
  const [todayMeals, setTodayMeals]       = useState([]);
  const [weekCalories, setWeekCalories]   = useState({});

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));

      const weightStored = await AsyncStorage.getItem('weightHistory');
      if (weightStored) setWeightHistory(JSON.parse(weightStored));

      // Load week calorie history from storage
      const weekStored = await AsyncStorage.getItem('weekCalories');
      if (weekStored) setWeekCalories(JSON.parse(weekStored));

      // Load today's real meals from API
      const meals = await api.getMeals();
      if (Array.isArray(meals)) {
        setTodayMeals(meals);
        // Save today's calories to week history
        const todayTotal = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        const todayKey   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const existing   = weekStored ? JSON.parse(weekStored) : {};
        const updated    = { ...existing, [todayKey]: todayTotal };
        setWeekCalories(updated);
        await AsyncStorage.setItem('weekCalories', JSON.stringify(updated));
      }
    } catch (e) {
      console.log(e);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const logWeight = async () => {
    const val = parseFloat(newWeight);
    if (!val || val < 20 || val > 400) {
      Alert.alert('Invalid weight', 'Please enter a realistic weight value.');
      return;
    }
    const today = new Date();
    const label = today.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const entry = { value: val, label, date: today.toISOString() };
    const updated = [...weightHistory, entry].slice(-12);
    setWeightHistory(updated);
    await AsyncStorage.setItem('weightHistory', JSON.stringify(updated));
    setNewWeight('');
    Alert.alert('Logged! 💪', `${val}kg recorded for today.`);
  };

  // Build this week's bar chart data from real logged calories
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun

  const weekData = DAYS.map((day, i) => {
    const dowIndex = (i + 1) % 7; // Mon=1 ... Sun=0
    const isToday  = dowIndex === todayDow;

    // Find the date for this day this week
    const diff = dowIndex - todayDow;
    const d    = new Date(today);
    d.setDate(today.getDate() + diff);
    const key = d.toISOString().slice(0, 10);

    const value = isToday
      ? todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
      : (weekCalories[key] || 0);

    return { label: day, value, isToday };
  });

  const calorieGoal  = user?.calorieGoal || 2000;
  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const maxCal       = Math.max(calorieGoal * 1.2, ...weekData.map(d => d.value), 1);

  const currentWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].value : null;
  const weightDelta = weightHistory.length >= 2
    ? (weightHistory[weightHistory.length - 1].value - weightHistory[0].value).toFixed(1) : null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={[styles.title, { color: theme.text }]}>Progress</Text>

        {/* Tab toggle */}
        <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calories' && { backgroundColor: theme.accent }]}
            onPress={() => setActiveTab('calories')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'calories' ? '#fff' : theme.textSecondary }]}>🔥 Calories</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weight' && { backgroundColor: theme.accent }]}
            onPress={() => setActiveTab('weight')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'weight' ? '#fff' : theme.textSecondary }]}>⚖️ Weight</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'calories' ? (
          <>
            <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.accent }]}>{calorieGoal}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Goal</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.text }]}>{todayCalories}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: todayCalories > calorieGoal ? '#ef4444' : theme.text }]}>
                  {Math.abs(calorieGoal - todayCalories)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  {todayCalories > calorieGoal ? 'Over' : 'Left'}
                </Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>This Week</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Daily calorie intake vs goal</Text>
              <BarChart data={weekData} maxVal={maxCal} color={theme.accent} goalVal={calorieGoal} theme={theme} />
              <View style={[styles.goalLine, { borderColor: theme.accent + '55' }]}>
                <Text style={[styles.goalLineLabel, { color: theme.accent }]}>Goal: {calorieGoal} cal/day</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.accent }]}>
                  {currentWeight ? `${currentWeight}kg` : '—'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Current</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: weightDelta > 0 ? '#ef4444' : '#22c55e' }]}>
                  {weightDelta ? `${weightDelta > 0 ? '+' : ''}${weightDelta}kg` : '—'}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Change</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.text }]}>{weightHistory.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Entries</Text>
              </View>
            </View>

            {/* Log weight */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Log Today's Weight</Text>
              <View style={styles.weightInputRow}>
                <TextInput
                  style={[styles.weightInput, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, flex: 1 }]}
                  placeholder="e.g. 75.5"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <View style={[styles.unitBadge, { backgroundColor: theme.accentLight }]}>
                  <Text style={[styles.unitText, { color: theme.accent }]}>kg</Text>
                </View>
                <TouchableOpacity style={[styles.logBtn, { backgroundColor: theme.accent }]} onPress={logWeight}>
                  <Text style={styles.logBtnText}>Log</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weight line chart */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Weight Trend</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Last {weightHistory.length} entries</Text>
              <WeightLineChart data={weightHistory.slice(-8)} color={theme.accent} theme={theme} />
            </View>

            {/* Weight history list */}
            {weightHistory.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>History</Text>
                {[...weightHistory].reverse().slice(0, 8).map((entry, i) => (
                  <View key={i} style={[styles.weightEntry, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.weightDate, { color: theme.textSecondary }]}>{entry.label}</Text>
                    <Text style={[styles.weightVal, { color: theme.text }]}>{entry.value}kg</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  tabRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  tab: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, justifyContent: 'space-around', alignItems: 'center' },
  stat: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: -4 },
  goalLine: { borderTopWidth: 1, borderStyle: 'dashed', marginTop: 4, paddingTop: 6 },
  goalLineLabel: { fontSize: 11, fontWeight: '500' },
  weightInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  weightInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '600' },
  unitBadge: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  unitText: { fontSize: 14, fontWeight: '700' },
  logBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  weightEntry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  weightDate: { fontSize: 13 },
  weightVal: { fontSize: 14, fontWeight: '700' },
});