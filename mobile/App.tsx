import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CoachScreen from './src/screens/CoachScreen';
import TrackScreen from './src/screens/TrackScreen';
import RestaurantsScreen from './src/screens/RestaurantsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { RootTabParamList } from './src/navigation';
import { colors } from './src/theme';
import { MobileAuthRoot } from './src/auth';

const Tab = createBottomTabNavigator<RootTabParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.text,
  },
};

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof RootTabParamList, { active: IconName; inactive: IconName }> = {
  Dashboard:   { active: 'home',          inactive: 'home-outline' },
  Coach:       { active: 'chatbubble',    inactive: 'chatbubble-outline' },
  Track:       { active: 'camera',        inactive: 'camera-outline' },
  Restaurants: { active: 'location',      inactive: 'location-outline' },
  Profile:     { active: 'person',        inactive: 'person-outline' },
};

function TabBarBackground() {
  // Liquid-glass: translucent blurred layer with a thin hairline on top.
  // Falls back to a plain translucent white on Android.
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="systemChromeMaterialLight"
        intensity={90}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.94)' }]} />;
}

export default function App() {
  return (
    <MobileAuthRoot>
      <SafeAreaProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="dark" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: colors.text,
              tabBarInactiveTintColor: colors.light,
              tabBarLabelStyle: { fontSize: 10, fontWeight: '500', marginTop: 2 },
              tabBarIconStyle: { marginTop: 2 },
              tabBarStyle: styles.tabBar,
              tabBarBackground: () => <TabBarBackground />,
              tabBarIcon: ({ focused, color, size }) => {
                const names = ICONS[route.name];
                return (
                  <Ionicons
                    name={focused ? names.active : names.inactive}
                    size={size - 2}
                    color={color}
                  />
                );
              },
            })}
          >
            <Tab.Screen name="Dashboard"   component={HomeScreen} />
            <Tab.Screen name="Coach"       component={CoachScreen} />
            <Tab.Screen name="Track"       component={TrackScreen} />
            <Tab.Screen name="Restaurants" component={RestaurantsScreen} />
            <Tab.Screen name="Profile"     component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </MobileAuthRoot>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    elevation: 0,
    // height is auto so the tab bar respects safe-area insets
  },
});
