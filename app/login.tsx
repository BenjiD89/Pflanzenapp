import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { signIn } from '../src/lib/auth';
import { COLORS } from '../src/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setFehler('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setFehler(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setFehler('Login fehlgeschlagen. E-Mail/Passwort prüfen.');
    }
    // Bei Erfolg übernimmt der Auth-Listener in app/_layout.tsx die Weiterleitung.
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titel}>🌿 Meine Pflanzen</Text>
      <Text style={styles.untertitel}>Bitte einloggen</Text>

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor="#9ab09e"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor="#9ab09e"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />

      {fehler && <Text style={styles.fehlerText}>{fehler}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Einloggen</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.greenDeep, justifyContent: 'center', padding: 28 },
  titel: { fontSize: 28, fontWeight: '700', color: COLORS.cream, textAlign: 'center', marginBottom: 6 },
  untertitel: { fontSize: 14, color: COLORS.greenPale, textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12, color: COLORS.text,
  },
  fehlerText: { color: '#ff9999', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.greenLight, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
