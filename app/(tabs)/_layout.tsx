import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../src/lib/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.greenMid,
        tabBarInactiveTintColor: '#9aa5a0',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: COLORS.greenPale },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pflanzen',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🌿</Text>,
        }}
      />
      <Tabs.Screen
        name="konfiguration"
        options={{
          title: 'Konfiguration',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
