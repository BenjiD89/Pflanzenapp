import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a3a2a' },
          headerTintColor: '#f5f0e8',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#faf8f3' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pflanze/[id]" options={{ title: 'Pflanze' }} />
      </Stack>
    </>
  );
}
