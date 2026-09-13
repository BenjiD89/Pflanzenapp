import { Tabs } from 'expo-router';
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
      <Tabs.Screen name="index" options={{ title: 'Pflanzen' }} />
      <Tabs.Screen name="konfiguration" options={{ title: 'Konfiguration' }} />
    </Tabs>
  );
}
