import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { usePflanzen, usePflanzenAmpel, useGruppen, addGiessungBatch } from '../src/lib/hooks';
import { COLORS, ZUSTAND_FARBE, ZUSTAND_EMOJI, WASSER_EMOJI, AMPEL_FARBE, AMPEL_EMOJI, AMPEL_LABEL } from '../src/lib/constants';
import type { PflanzeKomplett } from '../src/types';

export default function HomeScreen() {
  const { pflanzen, loading, reload } = usePflanzen();
  const { pflanzen: ampelListe, loading: ampelLoading, reload: ampelReload } = usePflanzenAmpel();
  const { gruppen: standortGruppen, loading: gruppenLoading } = useGruppen();
  const [suche, setSuche] = useState('');
  const [giessenLaeuft, setGiessenLaeuft] = useState<string | null>(null);

  const gefiltert = pflanzen.filter(p =>
    p.name.toLowerCase().includes(suche.toLowerCase()) ||
    (p.standort_zimmer ?? '').toLowerCase().includes(suche.toLowerCase()) ||
    (p.gattung ?? '').toLowerCase().includes(suche.toLowerCase())
  );

  const gruppenNachZimmer = gefiltert.reduce<Record<string, PflanzeKomplett[]>>((acc, p) => {
    const key = p.standort_zimmer ?? 'Kein Standort';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const rotAnzahl = ampelListe.filter(p => p.ampel_status === 'rot').length;

  async function batchGiessen(gruppeId: string, gruppeName: string) {
    const idsInGruppe = ampelListe.filter(p => p.gruppe_id === gruppeId).map(p => p.id);
    if (idsInGruppe.length === 0) {
      Alert.alert('Keine Pflanzen', `Für "${gruppeName}" sind noch keine Pflanzen hinterlegt.`);
      return;
    }
    setGiessenLaeuft(gruppeId);
    const { error } = await addGiessungBatch(idsInGruppe);
    setGiessenLaeuft(null);
    if (error) {
      Alert.alert('Fehler', 'Gießen konnte nicht gespeichert werden.');
      return;
    }
    ampelReload();
    Alert.alert('Erledigt', `${idsInGruppe.length} Pflanze${idsInGruppe.length > 1 ? 'n' : ''} in "${gruppeName}" als gegossen markiert.`);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🌿 Meine Pflanzen</Text>
            <Text style={styles.headerSub}>{pflanzen.length} Pflanzen · {Object.keys(gruppenNachZimmer).length} Räume</Text>
          </View>
          <TouchableOpacity style={styles.configButton} onPress={() => router.push('/konfiguration')}>
            <Text style={styles.configIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        {rotAnzahl > 0 && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>🔴 {rotAnzahl} Pflanze{rotAnzahl > 1 ? 'n' : ''} braucht Wasser</Text>
          </View>
        )}
      </View>

      {/* Batch-Gießen nach Gruppe */}
      {!gruppenLoading && standortGruppen.length > 0 && (
        <View style={styles.batchBereich}>
          <Text style={styles.batchTitel}>Auf einmal gießen</Text>
          <View style={styles.batchRow}>
            {standortGruppen.map(g => {
              const anzahlInGruppe = ampelListe.filter(p => p.gruppe_id === g.id).length;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.batchButton, g.platzhalter && styles.batchButtonPlatzhalter]}
                  onPress={() => batchGiessen(g.id, g.name)}
                  disabled={giessenLaeuft === g.id}
                >
                  <Text style={styles.batchButtonText}>
                    {g.typ === 'aussen' ? '🌤️' : '🏠'} {g.name}
                  </Text>
                  <Text style={styles.batchButtonSub}>
                    {g.platzhalter ? 'noch leer' : `${anzahlInGruppe} Pflanze${anzahlInGruppe === 1 ? '' : 'n'}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Suchen..."
          placeholderTextColor="#9ab09e"
          value={suche}
          onChangeText={setSuche}
        />
      </View>

      {loading || ampelLoading ? (
        <ActivityIndicator size="large" color={COLORS.greenMid} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={Object.entries(gruppenNachZimmer)}
          keyExtractor={([key]) => key}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { reload(); ampelReload(); }} tintColor={COLORS.greenMid} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: [zimmer, liste] }) => (
            <View style={styles.gruppe}>
              <View style={styles.gruppenHeader}>
                <Text style={styles.gruppenTitel}>📍 {zimmer}</Text>
                <Text style={styles.gruppenAnzahl}>{liste.length}</Text>
              </View>
              {liste.map(pflanze => {
                const ampelEintrag = ampelListe.find(a => a.id === pflanze.id);
                return (
                  <PflanzeKarte
                    key={pflanze.id}
                    pflanze={pflanze}
                    ampelStatus={ampelEintrag?.ampel_status ?? 'unbekannt'}
                    onPress={() => router.push(`/pflanze/${pflanze.id}`)}
                  />
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

function PflanzeKarte({
  pflanze, ampelStatus, onPress,
}: { pflanze: PflanzeKomplett; ampelStatus: string; onPress: () => void }) {
  const farbe = AMPEL_FARBE[ampelStatus] ?? COLORS.greenLight;
  const anzeigename = pflanze.spitzname || pflanze.name;

  return (
    <TouchableOpacity style={styles.karte} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.zustandBar, { backgroundColor: farbe }]} />

      <View style={styles.karteInhalt}>
        <View style={styles.karteOben}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pflanzenName}>{anzeigename}</Text>
            <Text style={styles.pflanzenArt}>{pflanze.gattung ?? ''} · {pflanze.art_lateinisch ?? ''}</Text>
          </View>
          <Text style={styles.zustandEmoji}>{AMPEL_EMOJI[ampelStatus] ?? '⚪'}</Text>
        </View>

        <View style={styles.karteUnten}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{AMPEL_LABEL[ampelStatus]}</Text>
          </View>
          {pflanze.standort_position && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{pflanze.standort_position}</Text>
            </View>
          )}
          {pflanze.topf_umtopfen_empfohlen && (
            <View style={[styles.chip, styles.chipWarn]}>
              <Text style={[styles.chipText, { color: COLORS.warning }]}>🪴 umtopfen</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { backgroundColor: COLORS.greenDeep, padding: 20, paddingTop: 56 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 26, fontWeight: '700', color: COLORS.cream },
  headerSub: { fontSize: 13, color: COLORS.greenPale, marginTop: 4 },
  configButton: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  configIcon: { fontSize: 18 },
  warnBanner: { backgroundColor: 'rgba(192,57,43,0.2)', borderRadius: 8, padding: 8, marginTop: 10 },
  warnText: { color: '#ff9999', fontSize: 13 },
  batchBereich: { paddingHorizontal: 16, paddingTop: 16 },
  batchTitel: { fontSize: 13, fontWeight: '600', color: COLORS.greenMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  batchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  batchButton: {
    backgroundColor: COLORS.greenPale, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
    minWidth: '47%',
  },
  batchButtonPlatzhalter: { opacity: 0.5 },
  batchButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.greenDeep },
  batchButtonSub: { fontSize: 11, color: COLORS.greenMid, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.greenPale,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: COLORS.text, fontSize: 15 },
  gruppe: { marginHorizontal: 16, marginBottom: 8 },
  gruppenHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8, marginTop: 8,
  },
  gruppenTitel: { fontSize: 13, fontWeight: '600', color: COLORS.greenMid, textTransform: 'uppercase', letterSpacing: 0.5 },
  gruppenAnzahl: { fontSize: 12, color: COLORS.greenLight, backgroundColor: COLORS.greenPale, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  karte: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  zustandBar: { width: 5 },
  karteInhalt: { flex: 1, padding: 14 },
  karteOben: { flexDirection: 'row', alignItems: 'flex-start' },
  pflanzenName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  pflanzenArt: { fontSize: 12, color: '#6a8a6e', marginTop: 2, fontStyle: 'italic' },
  zustandEmoji: { fontSize: 22, marginLeft: 8 },
  karteUnten: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  chip: { backgroundColor: COLORS.cream, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipWarn: { backgroundColor: 'rgba(230,126,34,0.1)' },
  chipText: { fontSize: 11, color: COLORS.brown, fontWeight: '500' },
});
