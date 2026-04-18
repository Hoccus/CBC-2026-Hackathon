import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  BarlowCondensed_500Medium, BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import HomeScreen from './src/screens/HomeScreen';
import FoodLogScreen from './src/screens/FoodLogScreen';
import RestaurantsScreen from './src/screens/RestaurantsScreen';
import MoreScreen from './src/screens/MoreScreen';
import PlanScreen from './src/screens/PlanScreen';
import CoachScreen from './src/screens/CoachScreen';
import CustomTabBar from './src/components/CustomTabBar';
import LogSheet from './src/components/LogSheet';
import { RootStackParamList, RootTabParamList } from './src/navigation';
import { colors } from './src/theme';
import { MobileAuthRoot } from './src/auth';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function MainTabs() {
  const [logOpen, setLogOpen] = useState(false);
  return (
    <>
      <Tab.Navigator
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
        tabBar={(props) => <CustomTabBar {...props} onFab={() => setLogOpen(true)} />}
      >
        <Tab.Screen name="Dashboard"   component={HomeScreen} />
        <Tab.Screen name="Log"         component={FoodLogScreen} />
        <Tab.Screen name="Restaurants" component={RestaurantsScreen} />
        <Tab.Screen name="More"        component={MoreScreen} />
      </Tab.Navigator>
      <LogSheet visible={logOpen} onClose={() => setLogOpen(false)} />
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({
    BarlowCondensed_500Medium, BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <MobileAuthRoot>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Plan"     component={PlanScreen} />
            <Stack.Screen
              name="Coach"
              component={CoachScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </MobileAuthRoot>
  );
}
