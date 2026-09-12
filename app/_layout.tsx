import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSession } from '../src/lib/auth';
import { COLORS } from '../src/lib/constants';

// Leitet nicht eingeloggte Nutzer:innen auf /login um und eingeloggte weg
// von /login - läuft bei jeder Navigation und jedem Auth-Statuswechsel.
function useAuthGate() {
  const { session, loading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // `login` fehlt noch in den generierten Router-Typen (werden beim nächsten
    // `expo start` neu erzeugt) - Vergleich/Navigation daher bewusst als string.
    const aufLoginSeite = (segments[0] as string) === 'login';

    if (!session && !aufLoginSeite) {
      router.replace('/login' as Parameters<typeof router.replace>[0]);
    } else if (session && aufLoginSeite) {
      router.replace('/');
    }
  }, [session, loading, segments]);

  return loading;
}

export default function RootLayout() {
  const authLaedt = useAuthGate();

  if (authLaedt) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.greenDeep }}>
        <ActivityIndicator size="large" color={COLORS.greenPale} />
      </View>
    );
  }

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
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
