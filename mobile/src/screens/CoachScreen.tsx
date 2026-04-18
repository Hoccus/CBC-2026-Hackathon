import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { API_BASE } from '../config';
import { colors, radius, type as T } from '../theme';
import { getProfile } from '../storage';
import { Profile } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CONTEXTS = [
  { value: '', label: 'Select situation...' },
  { value: 'at home — have access to a full kitchen', label: 'At home' },
  { value: 'at the airport', label: 'Airport' },
  { value: 'on the road — gas stations and fast food only', label: 'On the road' },
  { value: 'at a hotel — maybe a minibar and room service', label: 'Hotel' },
  { value: 'at a restaurant — can order anything', label: 'Restaurant' },
  { value: 'at a convenience store', label: 'Convenience store' },
];

export default function CoachScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setProfile(await getProfile()))();
    }, [])
  );

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const profileCtx = profile
        ? `${profile.restrictions.length ? 'Restrictions: ' + profile.restrictions.join(', ') + '. ' : ''}Goal: ${profile.goals.calories} kcal, ${profile.goals.protein}g protein.`
        : '';
      const res = await fetch(`${API_BASE}/api/coach/advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: context || undefined,
          profile_context: profileCtx || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.advice ?? '' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  const contextLabel = CONTEXTS.find((c) => c.value === context)?.label ?? CONTEXTS[0].label;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <Text style={T.h1}>Coach</Text>
          {profile?.name && (
            <Text style={[T.muted, { marginTop: 4 }]}>
              {profile.name} · {profile.goals.calories} kcal goal
            </Text>
          )}
        </View>

        <View style={styles.contextBar}>
          <Text style={styles.contextLabel}>WHERE ARE YOU?</Text>
          <TouchableOpacity style={styles.contextSelect} onPress={() => setPickerOpen(true)}>
            <Text style={{ fontSize: 13, color: colors.text }}>{contextLabel}</Text>
            <Text style={{ fontSize: 11, color: colors.light }}>▼</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatWrap}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.empty}>
              <Text style={[T.body, { fontWeight: '600' }]}>Ask your nutrition coach</Text>
              <Text style={[T.small, { marginTop: 6, textAlign: 'center', color: colors.light }]}>
                &ldquo;What should I eat at the airport?&rdquo;{'\n'}
                &ldquo;I have eggs, spinach, and cheese — what can I make?&rdquo;
              </Text>
            </View>
          )}
          {messages.map((m, i) => (
            <View
              key={i}
              style={[styles.bubble, m.role === 'user' ? styles.user : styles.assistant]}
            >
              <Text
                style={[styles.bubbleText, { color: m.role === 'user' ? '#fff' : colors.text }]}
              >
                {m.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, styles.assistant, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={colors.light} />
              <Text style={[T.small, { color: colors.light }]}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputRow, { paddingBottom: tabBarHeight + 8 }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What's in your fridge? What's on the menu?"
            placeholderTextColor={colors.light}
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.35 }]}
            onPress={send}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal transparent visible={pickerOpen} animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Where are you?</Text>
            {CONTEXTS.map((c) => (
              <TouchableOpacity
                key={c.value || 'none'}
                style={styles.modalItem}
                onPress={() => {
                  setContext(c.value);
                  setPickerOpen(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.text,
                    fontWeight: c.value === context ? '600' : '400',
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
  },
  contextLabel: { fontSize: 11, fontWeight: '600', color: colors.light, letterSpacing: 0.7 },
  contextSelect: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    backgroundColor: colors.bg,
  },
  chatWrap: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    marginBottom: 12,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  bubble: { padding: 10, borderRadius: radius, maxWidth: '80%' },
  user: { alignSelf: 'flex-end', backgroundColor: colors.text },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 13, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: colors.text,
    maxHeight: 100,
    fontSize: 13,
  },
  sendBtn: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: { fontSize: 13, fontWeight: '600', color: colors.light, letterSpacing: 0.7, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
});
