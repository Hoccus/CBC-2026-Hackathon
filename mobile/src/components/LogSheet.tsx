// LogSheet — bottom sheet from the FAB. Two stages: option grid → photo estimate.
import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, FONTS, MACRO } from '../theme';
import { DisplayNum, ICONS } from './atoms';

const RECENT = [
  { icon: '☕', name: 'Cold brew + protein bar',     loc: 'Starbucks, CNN Center', cal: 280 },
  { icon: '🥪', name: 'Turkey wrap',                 loc: 'Bureau kitchen',        cal: 620 },
  { icon: '🥗', name: 'Cat Cora — Salmon plate',     loc: 'ATL Concourse B',       cal: 640 },
];

export default function LogSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<'menu' | 'photo'>('menu');

  React.useEffect(() => {
    if (visible) setStage('menu');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {stage === 'menu' ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>LOG A MEAL</Text>
                <TouchableOpacity onPress={onClose} style={styles.smallBtn}>
                  <Ionicons name={ICONS.close} size={14} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.optGrid}>
                <Opt onPress={() => setStage('photo')} icon="📸" title="Photo + describe" sub="AI estimates macros" accent />
                <Opt icon="🎙️" title="Tell coach"   sub="Voice or text" />
                <Opt icon="🔍" title="Search"       sub="Restaurant + brands" />
                <Opt icon="⚡" title="Quick add"    sub="Just macros" />
              </View>

              <Text style={styles.recentLabel}>RECENT · ON THE ROAD</Text>
              <View style={{ gap: 6 }}>
                {RECENT.map((r, i) => (
                  <View key={i} style={styles.recentRow}>
                    <View style={styles.recentIcon}><Text style={{ fontSize: 16 }}>{r.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName}>{r.name}</Text>
                      <Text style={styles.recentLoc}>{r.loc}</Text>
                    </View>
                    <Text style={styles.recentCal}>{r.cal} kcal</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setStage('menu')} style={styles.smallBtn}>
                  <Ionicons name={ICONS.chevL} size={14} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.title, { fontSize: 18 }]}>PHOTO ESTIMATE</Text>
                <View style={{ width: 30 }} />
              </View>

              <LinearGradient
                colors={['#3a2a1a', '#5a3820', '#2a1a10']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.photo}
              >
                <Text style={{ fontSize: 80 }}>🥗</Text>
                <View style={styles.analyzing}>
                  <View style={styles.analyzingDot} />
                  <Text style={styles.analyzingText}>ANALYZING</Text>
                </View>
              </LinearGradient>

              <View style={styles.resultCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View>
                    <Text style={styles.resultTitle}>Harvest chicken bowl</Text>
                    <Text style={styles.resultSub}>Grown · estimated from photo</Text>
                  </View>
                  <View style={styles.confidenceTag}>
                    <Text style={styles.confidenceText}>HIGH CONFIDENCE</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[
                    { val: '580', label: 'kcal', c: MACRO.cal },
                    { val: '42g', label: 'P',    c: MACRO.p   },
                    { val: '18g', label: 'F',    c: MACRO.f   },
                    { val: '58g', label: 'C',    c: MACRO.c   },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1 }}>
                      <DisplayNum size={22}>{m.val}</DisplayNum>
                      <Text style={[styles.resultMacro, { color: m.c }]}>{m.label.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <TouchableOpacity style={styles.adjustBtn}><Text style={styles.adjustText}>Adjust</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn}><Text style={styles.confirmText}>Log at 13:20 · Centennial Park</Text></TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Opt({ icon, title, sub, accent, onPress }: { icon: string; title: string; sub: string; accent?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.opt,
        accent && { backgroundColor: colors.accent + '15', borderColor: colors.accent + '50' },
      ]}
    >
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
      <Text style={styles.optTitle}>{title}</Text>
      <Text style={styles.optSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: '#121212', width: '100%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 10, maxHeight: '90%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginVertical: 6, marginBottom: 16 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:     { fontFamily: FONTS.displayBold, fontSize: 22, color: colors.text, letterSpacing: 0.4 },
  smallBtn:  { width: 30, height: 30, borderRadius: 999, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },

  optGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  opt: {
    width: '48%', flexGrow: 1, padding: 14, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  optTitle: { fontSize: 13, fontFamily: FONTS.bodyBold, color: colors.text },
  optSub:   { fontSize: 11, color: colors.muted, fontFamily: FONTS.body, marginTop: 2 },

  recentLabel: { fontSize: 11, color: colors.light, fontFamily: FONTS.bodyBold, letterSpacing: 1, marginBottom: 8 },
  recentRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: colors.surface },
  recentIcon:  { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceStrong, alignItems: 'center', justifyContent: 'center' },
  recentName:  { fontSize: 13, color: colors.text, fontFamily: FONTS.bodySemi },
  recentLoc:   { fontSize: 11, color: colors.mutedSoft, fontFamily: FONTS.body },
  recentCal:   { fontSize: 12, color: colors.muted, fontFamily: FONTS.body },

  photo: { borderRadius: 16, overflow: 'hidden', position: 'relative', aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  analyzing: {
    position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  analyzingDot:  { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.accent },
  analyzingText: { color: '#fff', fontSize: 10, fontFamily: FONTS.bodyBold, letterSpacing: 0.7 },

  resultCard:   { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  resultTitle:  { fontSize: 14, fontFamily: FONTS.bodyBold, color: colors.text },
  resultSub:    { fontSize: 11, color: colors.muted, fontFamily: FONTS.body },
  resultMacro:  { fontSize: 10, fontFamily: FONTS.bodyBold, letterSpacing: 0.7, marginTop: 2 },

  confidenceTag:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: MACRO.c + '22' },
  confidenceText: { color: MACRO.c, fontSize: 10, fontFamily: FONTS.bodyBold, letterSpacing: 0.7 },

  adjustBtn:  { flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceStrong, alignItems: 'center' },
  adjustText: { color: colors.text, fontSize: 13, fontFamily: FONTS.bodySemi },
  confirmBtn: { flex: 2, padding: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center' },
  confirmText:{ color: '#111', fontSize: 13, fontFamily: FONTS.bodyBold },
});
