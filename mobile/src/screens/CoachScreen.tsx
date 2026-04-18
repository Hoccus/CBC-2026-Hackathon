// Coach — situation-aware chat (full-screen modal). Uses fake prototype thread for Phase 1.
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, FONTS, MACRO } from '../theme';
import { COACH_THREAD, FOOD_OPTIONS, USER } from '../data';
import { ICONS, ScoreBadge } from '../components/atoms';

const QUICK_PROMPTS = [
  "What's near me?",
  'Skip lunch — is that ok?',
  'Airport dinner options',
  'Cut fat today',
];

export default function CoachScreen() {
  const nav = useNavigation();
  const [input, setInput] = useState('');
  const remainingCal = USER.goals.cal - USER.today.cal;
  const lunchOpts = FOOD_OPTIONS[0].items;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Ionicons name={ICONS.close} size={16} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>COACH</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live · sees your calendar &amp; macros</Text>
          </View>
        </View>
        <View style={styles.kcalChip}>
          <Text style={styles.kcalText}>{remainingCal} kcal left</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 20, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {COACH_THREAD.map((m, i) => {
            if (m.role === 'context') {
              return (
                <View key={i} style={styles.contextBubble}>
                  <Ionicons name={ICONS.calendar} size={13} color={colors.mutedSoft} style={{ marginTop: 1 }} />
                  <Text style={styles.contextText}>{m.text}</Text>
                </View>
              );
            }
            if (m.role === 'user') {
              return (
                <View key={i} style={styles.userBubble}>
                  <Text style={styles.userText}>{m.text}</Text>
                </View>
              );
            }
            return (
              <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                <View style={styles.coachKicker}>
                  <Ionicons name={ICONS.sparkle} size={12} color={colors.accent} />
                  <Text style={styles.coachKickerText}>COACH</Text>
                </View>
                <View style={styles.coachBubble}>
                  <Text style={styles.coachText}>
                    {m.text.split('**').map((seg, j) => j % 2 === 1
                      ? <Text key={j} style={{ color: colors.accent, fontFamily: FONTS.bodyBold }}>{seg}</Text>
                      : <Text key={j}>{seg}</Text>
                    )}
                  </Text>
                </View>
                {m.suggestions && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {lunchOpts.slice(0, 2).map((opt, k) => (
                      <View key={k} style={styles.suggestion}>
                        <View style={[styles.suggestionIcon, {
                          backgroundColor: (k === 0 ? MACRO.cal : MACRO.p) + '22',
                        }]}>
                          <Text style={{ fontSize: 18 }}>{k === 0 ? '🥗' : '🍗'}</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Text style={styles.suggestionName}>{opt.name}</Text>
                            <ScoreBadge score={opt.score} />
                          </View>
                          <Text style={styles.suggestionMeta} numberOfLines={1}>
                            {opt.pick} · {opt.macros.cal} kcal · {opt.macros.p}g P · {opt.eta} away
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.logBtn}>
                          <Text style={styles.logBtnText}>Log</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_PROMPTS.map((q) => (
            <TouchableOpacity key={q} onPress={() => setInput(q)} style={styles.quickChip}>
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.composerInput}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this moment…"
              placeholderTextColor={colors.mutedSoft}
              style={styles.composerField}
            />
            <Ionicons name={ICONS.mic} size={16} color={colors.mutedSoft} />
          </View>
          <TouchableOpacity style={styles.sendBtn}>
            <Ionicons name={ICONS.send} size={18} color="#111" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 22, color: colors.text, letterSpacing: 0.4 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  statusDot:  { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.accent },
  statusText: { fontSize: 11, color: colors.accent, fontFamily: FONTS.body },
  kcalChip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.surfaceStrong },
  kcalText:   { fontSize: 11, color: colors.muted, fontFamily: FONTS.bodySemi },

  contextBubble: {
    alignSelf: 'center', maxWidth: '88%', flexDirection: 'row', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  contextText: { flex: 1, fontSize: 11, color: colors.muted, fontFamily: FONTS.body, lineHeight: 16 },

  userBubble:   { alignSelf: 'flex-end', maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: '#fff' },
  userText:     { color: '#111', fontSize: 14, fontFamily: FONTS.bodyMed, lineHeight: 20 },

  coachKicker:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  coachKickerText: { fontSize: 11, color: colors.accent, fontFamily: FONTS.bodyBold, letterSpacing: 0.9 },
  coachBubble:     { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.surfaceStrong },
  coachText:       { fontSize: 14, color: colors.text, fontFamily: FONTS.body, lineHeight: 21 },

  suggestion: {
    flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12,
    borderRadius: 14, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  suggestionIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestionName: { fontSize: 13, fontFamily: FONTS.bodyBold, color: colors.text },
  suggestionMeta: { fontSize: 11, color: colors.muted, fontFamily: FONTS.body },
  logBtn:         { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  logBtnText:     { color: '#111', fontSize: 11, fontFamily: FONTS.bodyBold },

  quickChip: {
    backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
  },
  quickChipText: { color: colors.text, fontSize: 12, fontFamily: FONTS.bodyMed },

  composer: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  composerInput: {
    flex: 1, backgroundColor: colors.surfaceStrong, borderRadius: 999,
    borderWidth: 1, borderColor: colors.borderStrong,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  composerField: { flex: 1, color: colors.text, fontSize: 14, fontFamily: FONTS.body },
  sendBtn:       { width: 42, height: 42, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
