import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl, Alert, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { usePflanzen, usePflanzenAmpel, addGiessung, addGiessungBatch } from '../../src/lib/hooks';
import { COLORS, AMPEL_FARBE } from '../../src/lib/constants';
import type { PflanzeKomplett, PflanzeAmpel } from '../../src/types';

const ETAGEN_REIHENFOLGE = ['Keller', 'Erdgeschoss', 'Obergeschoss', 'Dachgeschoss'];

function letzteGiessungText(tage: number | null | undefined): string {
  if (tage === null || tage === undefined) return 'Noch nie gegossen';
  if (tage === 0) return 'Heute schon gegossen';
  if (tage === 1) return 'vor 1 Tag gegossen';
  return `vor ${tage} Tagen gegossen`;
}

export default function HomeScreen() {
  const { pflanzen, loading, reload } = usePflanzen();
  const { pflanzen: ampelListe, loading: ampelLoading, reload: ampelReload } = usePflanzenAmpel();
  const [suche, setSuche] = useState('');
  const [wateringId, setWateringId] = useState<string | null>(null);
  const [wateringArea, setWateringArea] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const spalten = width < 400 ? 2 : 3;

  const ampelMap = useMemo(() => {
    const map: Record<string, PflanzeAmpel> = {};
    ampelListe.forEach(a => { map[a.id] = a; });
    return map;
  }, [ampelListe]);

  const gefiltert = pflanzen.filter(p => {
    const q = suche.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.spitzname ?? '').toLowerCase().includes(q) ||
      (p.standort_zimmer ?? '').toLowerCase().includes(q) ||
      (p.gattung ?? '').toLowerCase().includes(q)
    );
  });

  const gruppiert = useMemo(() => {
    const map: Record<string, Record<string, PflanzeKomplett[]>> = {};
    for (const p of gefiltert) {
      const etage = p.standort_etage ?? 'Sonstige';
      const zimmer = p.standort_zimmer ?? 'Kein Zimmer';
      if (!map[etage]) map[etage] = {};
      if (!map[etage][zimmer]) map[etage][zimmer] = [];
      map[etage][zimmer].push(p);
    }
    return map;
  }, [gefiltert]);

  const etagenSortiert = Object.keys(gruppiert).sort((a, b) => {
    const ia = ETAGEN_REIHENFOLGE.indexOf(a);
    const ib = ETAGEN_REIHENFOLGE.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const rotAnzahl = ampelListe.filter(p => p.ampel_status === 'rot').length;

  async function waterSingle(pflanzeId: string) {
    setWateringId(pflanzeId);
    const { error } = await addGiessung(pflanzeId);
    setWateringId(null);
    if (error) {
      Alert.alert('Fehler', 'Gießen konnte nicht gespeichert werden.');
      return;
    }
    ampelReload();
  }

  async function waterArea(ids: string[], name: string) {
    if (ids.length === 0) {
      Alert.alert('Keine Pflanzen', `Für "${name}" sind noch keine Pflanzen hinterlegt.`);
      return;
    }
    setWateringArea(name);
    const { error } = await addGiessungBatch(ids);
    setWateringArea(null);
    if (error) {
      Alert.alert('Fehler', 'Gießen konnte nicht gespeichert werden.');
      return;
    }
    ampelReload();
    Alert.alert('✅ Erledigt', `${ids.length} Pflanze${ids.length > 1 ? 'n' : ''} in "${name}" gegossen.`);
  }

  function reloadAll() {
    reload();
    ampelReload();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌿 Meine Pflanzen</Text>
        <Text style={styles.headerSub}>{pflanzen.length} Pflanzen · {etagenSortiert.length} Etagen</Text>
        {rotAnzahl > 0 && (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>🔴 {rotAnzahl} Pflanze{rotAnzahl > 1 ? 'n' : ''} braucht Wasser</Text>
          </View>
        )}
      </View>

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
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reloadAll} tintColor={COLORS.greenMid} />}
        >
          {etagenSortiert.map(etage => {
            const zimmerMap = gruppiert[etage];
            const zimmerNamen = Object.keys(zimmerMap).sort();
            const etagePflanzen = zimmerNamen.flatMap(z => zimmerMap[z]);
            const etageIds = etagePflanzen.map(p => p.id);

            return (
              <View key={etage} style={styles.etageBlock}>
                <TouchableOpacity
                  style={styles.etageHeader}
                  onPress={() => waterArea(etageIds, etage)}
                  disabled={wateringArea === etage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.etageTitel}>🏢 {etage}</Text>
                  <Text style={styles.etageAktion}>
                    {wateringArea === etage ? '…' : `💧 alle gießen (${etageIds.length})`}
                  </Text>
                </TouchableOpacity>

                {zimmerNamen.map(zimmer => {
                  const plantsInZimmer = zimmerMap[zimmer];
                  const zimmerIds = plantsInZimmer.map(p => p.id);
                  const tileWidth = spalten === 2 ? '48%' : '31%';

                  return (
                    <View key={zimmer} style={styles.zimmerBlock}>
                      <TouchableOpacity
                        style={styles.zimmerHeader}
                        onPress={() => waterArea(zimmerIds, zimmer)}
                        disabled={wateringArea === zimmer}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.zimmerTitel}>📍 {zimmer}</Text>
                        <Text style={styles.zimmerAktion}>
                          {wateringArea === zimmer ? '…' : `${plantsInZimmer.length} · 💧`}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.grid}>
                        {plantsInZimmer.map(p => (
                          <PflanzeTile
                            key={p.id}
                            pflanze={p}
                            ampelStatus={ampelMap[p.id]?.ampel_status ?? 'unbekannt'}
                            tageSeitGiessung={ampelMap[p.id]?.tage_seit_giessung ?? null}
                            watering={wateringId === p.id}
                            width={tileWidth}
                            onWater={() => waterSingle(p.id)}
                            onInfo={() => router.push(`/pflanze/${p.id}`)}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function PflanzeTile({
  pflanze, ampelStatus, tageSeitGiessung, watering, width, onWater, onInfo,
}: {
  pflanze: PflanzeKomplett;
  ampelStatus: string;
  tageSeitGiessung: number | null;
  watering: boolean;
  width: `${number}%`;
  onWater: () => void;
  onInfo: () => void;
}) {
  const farbe = AMPEL_FARBE[ampelStatus] ?? COLORS.greenLight;
  const spitzname = pflanze.spitzname || pflanze.name;
  const zweitname = pflanze.spitzname ? pflanze.name : '';

  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: farbe, width }]}
      onPress={onWater}
      disabled={watering}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={styles.infoButton}
        onPress={(e) => { e.stopPropagation(); onInfo(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.infoIcon}>ℹ️</Text>
      </TouchableOpacity>

      {watering ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.tileTextWrap}>
          <Text style={styles.tileName} numberOfLines={2}>{spitzname}</Text>
          {!!zweitname && <Text style={styles.tileSubname} numberOfLines={1}>{zweitname}</Text>}
          <Text style={styles.tileGiessInfo} numberOfLines={1}>{letzteGiessungText(tageSeitGiessung)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { backgroundColor: COLORS.greenDeep, padding: 20, paddingTop: 56 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: COLORS.cream },
  headerSub: { fontSize: 13, color: COLORS.greenPale, marginTop: 4 },
  warnBanner: { backgroundColor: 'rgba(192,57,43,0.2)', borderRadius: 8, padding: 8, marginTop: 10 },
  warnText: { color: '#ff9999', fontSize: 13 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.greenPale,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, color: COLORS.text, fontSize: 15 },

  etageBlock: { marginBottom: 8 },
  etageHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 16, backgroundColor: COLORS.greenDeep,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8,
  },
  etageTitel: { fontSize: 15, fontWeight: '700', color: COLORS.cream },
  etageAktion: { fontSize: 12, color: COLORS.greenPale, fontWeight: '600' },

  zimmerBlock: { marginHorizontal: 16, marginBottom: 12 },
  zimmerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  zimmerTitel: { fontSize: 13, fontWeight: '600', color: COLORS.greenMid, textTransform: 'uppercase', letterSpacing: 0.5 },
  zimmerAktion: {
    fontSize: 11, color: COLORS.greenDeep, backgroundColor: COLORS.greenPale,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, fontWeight: '600',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    aspectRatio: 1,
    borderRadius: 14,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  infoButton: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  infoIcon: { fontSize: 11 },
  tileTextWrap: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  tileName: { width: '100%', fontSize: 16, fontWeight: '800', color: '#fff', textAlign: 'center' },
  tileSubname: { width: '100%', fontSize: 9, fontWeight: '400', color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  tileGiessInfo: { width: '100%', fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: 5, textAlign: 'center' },
});
