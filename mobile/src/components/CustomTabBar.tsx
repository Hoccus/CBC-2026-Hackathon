// Custom dark tab bar — search input + 4 tabs + centered FAB.
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, FONTS } from '../theme';
import { ICONS } from './atoms';

interface Props extends BottomTabBarProps {
  onFab: () => void;
}

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Dashboard',
  Log: 'Food Log',
  Restaurants: 'Restaurants',
  More: 'More',
};

const TAB_ICON: Record<string, string> = {
  Dashboard: 'dashboard',
  Log: 'log',
  Restaurants: 'restaurants',
  More: 'more',
};

export default function CustomTabBar({ state, navigation, onFab }: Props) {
  const insets = useSafeAreaInsets();
  // Compute order: tabs[0..1] then FAB then tabs[2..]. We have exactly 4 tabs → 2 left, 2 right.
  const tabs = state.routes;
  const split = Math.ceil(tabs.length / 2);
  const left = tabs.slice(0, split);
  const right = tabs.slice(split);

  return (
    <LinearGradient
      colors={['rgba(10,10,10,0)', '#0a0a0a']}
      locations={[0, 0.35]}
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      {/* Search bar */}
      <View style={styles.search}>
        <Ionicons name={ICONS.search} size={16} color={colors.mutedSoft} />
        <TextInput
          placeholder="Search for a food"
          placeholderTextColor={colors.mutedSoft}
          style={styles.searchInput}
        />
        <Ionicons name={ICONS.barcode} size={18} color={colors.mutedSoft} />
      </View>

      {/* Row: left tabs · FAB · right tabs */}
      <View style={styles.row}>
        {left.map((route, i) => renderTab(route.name, state.index === i, () => onTabPress(navigation, route, state.index === i)))}

        <TouchableOpacity
          onPress={onFab}
          activeOpacity={0.85}
          style={styles.fab}
        >
          <Ionicons name={ICONS.plus} size={26} color="#111" />
        </TouchableOpacity>

        {right.map((route, j) => {
          const idx = split + j;
          return renderTab(route.name, state.index === idx, () => onTabPress(navigation, route, state.index === idx));
        })}
      </View>
    </LinearGradient>
  );
}

function renderTab(name: string, isActive: boolean, onPress: () => void) {
  const baseKey = TAB_ICON[name];
  const iconName = (isActive ? ICONS[baseKey + 'Active'] : ICONS[baseKey]) as React.ComponentProps<typeof Ionicons>['name'];
  return (
    <TouchableOpacity
      key={name}
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.tab}
    >
      <Ionicons name={iconName} size={22} color={isActive ? colors.text : colors.mutedSoft} />
      <Text style={[styles.tabLabel, { color: isActive ? colors.text : colors.mutedSoft, fontFamily: isActive ? FONTS.bodyBold : FONTS.bodyMed }]}>
        {TAB_LABELS[name] ?? name}
      </Text>
    </TouchableOpacity>
  );
}

function onTabPress(
  navigation: BottomTabBarProps['navigation'],
  route: BottomTabBarProps['state']['routes'][number],
  isFocused: boolean,
) {
  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
  if (!isFocused && !event.defaultPrevented) {
    navigation.navigate(route.name as never);
  }
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 8,
  },
  search: {
    height: 44, marginHorizontal: 16, marginBottom: 10,
    paddingHorizontal: 14, gap: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1, borderColor: colors.borderStrong,
    flexDirection: 'row', alignItems: 'center',
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, fontFamily: FONTS.body, paddingVertical: Platform.OS === 'ios' ? 6 : 0 },

  row: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 8,
  },
  tab:      { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 8, minWidth: 60, gap: 3 },
  tabLabel: { fontSize: 10 },

  fab: {
    width: 54, height: 54, borderRadius: 999, marginTop: -12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#fff', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
