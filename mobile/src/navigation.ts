// Navigation types.
//
// Structure:
//   RootStack
//     ├── MainTabs (default)
//     │     ├── Dashboard
//     │     ├── Log         (food log)
//     │     ├── Restaurants (real backend)
//     │     └── More
//     ├── Plan              (pushed)
//     └── Coach             (full-screen modal)
//
// The FAB in the custom tab bar opens an in-place LogSheet (not a route).

export type RootTabParamList = {
  Dashboard: undefined;
  Log: undefined;
  Restaurants: undefined;
  More: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Plan: undefined;
  Coach: undefined;
};
