import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 140;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data, maxVal, color, theme }) {
  if (!data || data.length === 0) return null;
  const barWidth = (CHART_WIDTH / data.length) - 8;

  return (
    <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
      <View style={styles.barsRow}>
        {data.map((item, i) => {
          const pct = maxVal > 0 ? (item.value / maxVal) : 0;
          const barHeight = Math.max(pct * (CHART_HEIGHT - 28), 2);
          return (
            <View key={i} style={[styles.barCol, { width: barWidth + 8 }]}>
              <Text style={[styles.barTopLabel, { color: theme.textTertiary }]}>
                {item.value > 0 ? item.value : ''}
              </Text>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor: item.isToday ? color : color + '66',
                    borderRadius: 6,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: item.isToday ? 0.5 : 0.2,
                    shadowRadius: item.isToday ? 8 : 4,
                  }
                ]} />
              </View>
              <Text style={[styles.barLabel, { color: item.isToday ? theme.text : theme.textTertiary, fontWeight: item.isToday ? '700' : '400' }]}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Mini line chart ──────────────────────────────────────────────────────────
function LineChart({ data, color, theme }) {
  if (!data || data.length < 2) return (
    <View style={[styles.chartContainer, { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={[styles.noDataText, { color: theme.textTertiary }]}>Log at least 2 weigh-ins to see your trend</Text>
    </View>
  );

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) - 1;
  const maxVal = Math.max(...values) + 1;
  const range  = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - 28 - ((d.value - minVal) / range) * (CHART_HEIGHT - 48),
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
      <svg width={CHART_WIDTH} height={CHART_HEIGHT - 20} style={{ overflow: 'visible' }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />
        ))}
      </svg>
      <View style={styles.lineLabels}>
        {points.map((p, i) => (
          <Text key={i} style={[styles.barLabel, { color: theme.textTertiary, width: CHART_WIDTH / points.length, textAlign: 'center' }]}>
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function ProgressScreen({ theme }) {
  const [calorieHistory, setCalorieHistory]   = useState([]);
  const [weightHistory, setWeightHistory]     = useState([]);
  const [newWeight, setNewWeight]             = useState('');
  const [user, setUser]                       = useState(null);
  const [activeTab, setActiveTab]             = useState('calories');

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));

      const calStored = await AsyncStorage.getItem('calorieHistory');
      if (calStored) setCalorieHistory(JSON.parse(calStored));

      const weightStored = await AsyncStorage.getItem('weightHistory');
      if (weightStored) setWeightHistory(JSON.parse(weightStored));
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

    const updated = [...weightHistory, entry].slice(-12); // keep last 12
    setWeightHistory(updated);
    await AsyncStorage.setItem('weightHistory', JSON.stringify(updated));
    setNewWeight('');
    Alert.alert('Logged! 💪', `${val}kg recorded for today.`);
  };

  // Build this week's calorie data
  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  const weekData = DAYS.map((day, i) => {
    const dayIndex = (i + 1) % 7; // Mon=1 ... Sun=0
    const isToday = dayIndex === todayDay;
    const entry = calorieHistory.find(h => {
      const d = new Date(h.date);
      return d.getDay() === dayIndex && isToday;
    });
    return { label: day, value: isToday ? (entry?.calories || 0) : 0, isToday };
  });

  const calorieGoal = user?.calorieGoal || 2000;
  const maxCal = Math.max(calorieGoal * 1.2, ...weekData.map(d => d.value));

  const currentWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].value
    : null;

  const weightDelta = weightHistory.length >= 2
    ? (weightHistory[weightHistory.length - 1].value - weightHistory[0].value).toFixed(1)
    : null;

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
            <Text style={[styles.tabText, { color: activeTab === 'calories' ? '#fff' : theme.textSecondary }]}>
              🔥 Calories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weight' && { backgroundColor: theme.accent }]}
            onPress={() => setActiveTab('weight')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'weight' ? '#fff' : theme.textSecondary }]}>
              ⚖️ Weight
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'calories' ? (
          <>
            {/* Calorie stats */}
            <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.accent }]}>{calorieGoal}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily goal</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.text }]}>{weekData.find(d => d.isToday)?.value || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: theme.text }]}>
                  {calorieGoal - (weekData.find(d => d.isToday)?.value || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Remaining</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>This Week</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Daily calorie intake</Text>
              <BarChart data={weekData} maxVal={maxCal} color={theme.accent} theme={theme} />
              <View style={[styles.goalLine, { borderColor: theme.accent + '44' }]}>
                <Text style={[styles.goalLineLabel, { color: theme.accent }]}>Goal: {calorieGoal} cal</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Weight stats */}
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

            {/* Weight history */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Weight Trend</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Last {weightHistory.length} entries</Text>
              {weightHistory.length >= 2 ? (
                <View style={styles.weightList}>
                  {[...weightHistory].reverse().slice(0, 8).map((entry, i) => (
                    <View key={i} style={[styles.weightEntry, { borderBottomColor: theme.border }]}>
                      <Text style={[styles.weightDate, { color: theme.textSecondary }]}>{entry.label}</Text>
                      <Text style={[styles.weightVal, { color: theme.text }]}>{entry.value}kg</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.noDataText, { color: theme.textTertiary }]}>
                  Log at least 2 weigh-ins to see your trend
                </Text>
              )}
            </View>
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

  tabRow: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    padding: 4, gap: 4,
  },
  tab: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },

  statsRow: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 16, justifyContent: 'space-around', alignItems: 'center',
  },
  stat: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32 },

  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: -4 },

  chartContainer: { marginTop: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingBottom: 20 },
  barCol: { alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: { justifyContent: 'flex-end', height: CHART_HEIGHT - 44 },
  barFill: {},
  barTopLabel: { fontSize: 9, marginBottom: 2, height: 12 },
  barLabel: { fontSize: 10, marginTop: 4 },

  lineLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  noDataText: { fontSize: 13, textAlign: 'center', paddingVertical: 20, lineHeight: 20 },

  goalLine: {
    borderTopWidth: 1, borderStyle: 'dashed',
    marginTop: 4, paddingTop: 6,
  },
  goalLineLabel: { fontSize: 11, fontWeight: '500' },

  weightInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  weightInput: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '600' },
  unitBadge: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  unitText: { fontSize: 14, fontWeight: '700' },
  logBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  weightList: { gap: 0, marginTop: 4 },
  weightEntry: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5,
  },
  weightDate: { fontSize: 13 },
  weightVal: { fontSize: 14, fontWeight: '700' },
});