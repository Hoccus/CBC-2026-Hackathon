import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import TrackScreen from './src/screens/TrackScreen';
import CoachScreen from './src/screens/CoachScreen';
import RestaurantsScreen from './src/screens/RestaurantsScreen';
import { RootStackParamList } from './src/navigation';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.accent,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'NutriCoach' }} />
        <Stack.Screen name="Track" component={TrackScreen} options={{ title: 'Track Meal' }} />
        <Stack.Screen name="Coach" component={CoachScreen} options={{ title: 'Coach' }} />
        <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={{ title: 'Nearby' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
