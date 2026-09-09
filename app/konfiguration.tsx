import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  usePflanzen, useZimmer, useKatalog, addZimmer, addPflanze, uploadFoto, updateFotoUrl,
} from '../src/lib/hooks';
import { COLORS } from '../src/lib/constants';

export default function KonfigurationScreen() {
  const { pflanzen, loading, reload } = usePflanzen();
  const { zimmer, reload: reloadZimmer } = useZimmer();
  const { katalog } = useKatalog();
  const [formularOffen, setFormularOffen] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.zurueckBtn}>
          <Text style={styles.zurueckText}>‹ Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ Konfiguration</Text>
        <Text style={styles.headerSub}>{pflanzen.length} Pflanzen im Bestand</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.greenMid} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <TouchableOpacity style={styles.neueButton} onPress={() => setFormularOffen(true)}>
            <Text style={styles.neueButtonText}>➕ Neue Pflanze hinzufügen</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitel}>Alle Pflanzen</Text>
          <View style={styles.grid}>
            {pflanzen.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.pflanzenKachel}
                onPress={() => router.push(`/pflanze/${p.id}`)}
              >
                {p.foto_url ? (
                  <Image source={{ uri: p.foto_url }} style={styles.kachelFoto} resizeMode="cover" />
                ) : (
                  <View style={styles.kachelFotoPlatzhalter}>
                    <Text style={{ fontSize: 28 }}>🌿</Text>
                  </View>
                )}
                <Text style={styles.kachelName}>{p.spitzname || p.name}</Text>
                <Text style={styles.kachelUnterzeile}>{p.gattung} · {p.standort_zimmer ?? 'kein Standort'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <NeuePflanzeModal
        sichtbar={formularOffen}
        onClose={() => setFormularOffen(false)}
        zimmerListe={zimmer}
        katalog={katalog}
        onZimmerHinzugefuegt={reloadZimmer}
        onPflanzeHinzugefuegt={() => { reload(); setFormularOffen(false); }}
      />
    </View>
  );
}

function NeuePflanzeModal({
  sichtbar, onClose, zimmerListe, katalog, onZimmerHinzugefuegt, onPflanzeHinzugefuegt,
}: {
  sichtbar: boolean;
  onClose: () => void;
  zimmerListe: { id: string; name: string; etage: string | null }[];
  katalog: { id: string; pflanzenname_de: string; gattung: string }[];
  onZimmerHinzugefuegt: () => void;
  onPflanzeHinzugefuegt: () => void;
}) {
  const [name, setName] = useState('');
  const [spitzname, setSpitzname] = useState('');
  const [artId, setArtId] = useState<string | null>(null);
  const [zimmerId, setZimmerId] = useState<string | null>(null);
  const [neuesZimmerName, setNeuesZimmerName] = useState('');
  const [neuesZimmerModus, setNeuesZimmerModus] = useState(false);
  const [topfgroesse, setTopfgroesse] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [speichern, setSpeichern] = useState(false);

  function zuruecksetzen() {
    setName(''); setSpitzname(''); setArtId(null); setZimmerId(null);
    setNeuesZimmerName(''); setNeuesZimmerModus(false); setTopfgroesse('');
    setFotoUri(null);
  }

  async function fotoAufnehmen() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }

  async function fotoAusGalerie() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, allowsEditing: true, aspect: [4, 3],
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }

  async function speichernHandler() {
    if (!name.trim()) {
      Alert.alert('Name fehlt', 'Bitte einen Namen für die Pflanze eingeben.');
      return;
    }
    if (!artId) {
      Alert.alert('Pflanzenart fehlt', 'Bitte eine Pflanzenart auswählen.');
      return;
    }

    setSpeichern(true);

    let finaleZimmerId = zimmerId;
    let zimmerName = zimmerListe.find(z => z.id === zimmerId)?.name ?? '';
    let zimmerEtage = zimmerListe.find(z => z.id === zimmerId)?.etage ?? '';

    if (neuesZimmerModus && neuesZimmerName.trim()) {
      const { data, error } = await addZimmer(neuesZimmerName.trim(), zimmerEtage || 'Erdgeschoss');
      if (error) {
        Alert.alert('Fehler', 'Zimmer konnte nicht angelegt werden.');
        setSpeichern(false);
        return;
      }
      finaleZimmerId = data.id;
      zimmerName = data.name;
      zimmerEtage = data.etage;
      onZimmerHinzugefuegt();
    }

    const neueId = 'p' + Date.now().toString().slice(-6);

    const { error } = await addPflanze({
      id: neueId,
      name: name.trim(),
      spitzname: spitzname.trim() || name.trim(),
      art_id: artId,
      standort_zimmer: zimmerName || 'Unbekannt',
      standort_etage: zimmerEtage || 'Erdgeschoss',
      topf_innendurchmesser_mm: topfgroesse ? parseInt(topfgroesse, 10) : undefined,
    });

    if (error) {
      Alert.alert('Fehler', 'Pflanze konnte nicht angelegt werden.');
      setSpeichern(false);
      return;
    }

    if (fotoUri) {
      const url = await uploadFoto(neueId, fotoUri);
      if (url) await updateFotoUrl(neueId, url);
    }

    setSpeichern(false);
    zuruecksetzen();
    Alert.alert('✅ Erledigt', 'Die neue Pflanze wurde angelegt.');
    onPflanzeHinzugefuegt();
  }

  return (
    <Modal visible={sichtbar} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.modalTitel}>Neue Pflanze hinzufügen</Text>

        {/* Foto */}
        <Text style={styles.feldLabel}>Foto</Text>
        <View style={styles.fotoAuswahlBereich}>
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.fotoVorschau} resizeMode="cover" />
          ) : (
            <View style={styles.fotoVorschauPlatzhalter}>
              <Text style={{ fontSize: 32 }}>🌿</Text>
            </View>
          )}
          <View style={styles.fotoButtonSpalte}>
            <TouchableOpacity style={styles.fotoKleinerButton} onPress={fotoAufnehmen}>
              <Text style={styles.fotoKleinerButtonText}>📷 Kamera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fotoKleinerButton} onPress={fotoAusGalerie}>
              <Text style={styles.fotoKleinerButtonText}>🖼️ Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.feldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="z.B. Monstera Küche" />

        {/* Spitzname */}
        <Text style={styles.feldLabel}>Spitzname (optional)</Text>
        <TextInput style={styles.input} value={spitzname} onChangeText={setSpitzname} placeholder="z.B. Frieda" />

        {/* Pflanzenart Dropdown */}
        <Text style={styles.feldLabel}>Pflanzenart</Text>
        <View style={styles.chipAuswahl}>
          {katalog.map(k => (
            <TouchableOpacity
              key={k.id}
              style={[styles.auswahlChip, artId === k.id && styles.auswahlChipAktiv]}
              onPress={() => setArtId(k.id)}
            >
              <Text style={[styles.auswahlChipText, artId === k.id && styles.auswahlChipTextAktiv]}>
                {k.pflanzenname_de}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zimmer Dropdown */}
        <Text style={styles.feldLabel}>Zimmer / Standort</Text>
        <View style={styles.chipAuswahl}>
          {zimmerListe.map(z => (
            <TouchableOpacity
              key={z.id}
              style={[styles.auswahlChip, zimmerId === z.id && !neuesZimmerModus && styles.auswahlChipAktiv]}
              onPress={() => { setZimmerId(z.id); setNeuesZimmerModus(false); }}
            >
              <Text style={[styles.auswahlChipText, zimmerId === z.id && !neuesZimmerModus && styles.auswahlChipTextAktiv]}>
                {z.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.auswahlChip, neuesZimmerModus && styles.auswahlChipAktiv]}
            onPress={() => setNeuesZimmerModus(true)}
          >
            <Text style={[styles.auswahlChipText, neuesZimmerModus && styles.auswahlChipTextAktiv]}>
              ➕ Neues Zimmer
            </Text>
          </TouchableOpacity>
        </View>
        {neuesZimmerModus && (
          <TextInput
            style={styles.input}
            value={neuesZimmerName}
            onChangeText={setNeuesZimmerName}
            placeholder="Name des neuen Zimmers"
          />
        )}

        {/* Topfgröße */}
        <Text style={styles.feldLabel}>Topfgröße (Innendurchmesser in mm)</Text>
        <TextInput
          style={styles.input}
          value={topfgroesse}
          onChangeText={setTopfgroesse}
          placeholder="z.B. 180"
          keyboardType="numeric"
        />

        {/* Aktionen */}
        <View style={styles.modalAktionen}>
          <TouchableOpacity style={styles.abbrechenButton} onPress={() => { zuruecksetzen(); onClose(); }}>
            <Text style={styles.abbrechenButtonText}>Abbrechen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.speichernButton} onPress={speichernHandler} disabled={speichern}>
            <Text style={styles.speichernButtonText}>{speichern ? 'Speichert...' : 'Speichern'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  header: { backgroundColor: COLORS.greenDeep, padding: 20, paddingTop: 56 },
  zurueckBtn: { marginBottom: 8 },
  zurueckText: { color: COLORS.greenPale, fontSize: 15 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.cream },
  headerSub: { fontSize: 13, color: COLORS.greenPale, marginTop: 4 },
  neueButton: {
    backgroundColor: COLORS.greenMid, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
  },
  neueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitel: { fontSize: 13, fontWeight: '600', color: COLORS.greenMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pflanzenKachel: {
    width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  kachelFoto: { width: '100%', height: 100, borderRadius: 10, marginBottom: 8 },
  kachelFotoPlatzhalter: {
    width: '100%', height: 100, borderRadius: 10, marginBottom: 8,
    backgroundColor: COLORS.greenPale, alignItems: 'center', justifyContent: 'center',
  },
  kachelName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  kachelUnterzeile: { fontSize: 11, color: '#6a8a6e', marginTop: 2 },

  modalContainer: { flex: 1, backgroundColor: COLORS.warmWhite, paddingTop: 40 },
  modalTitel: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  feldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.greenDeep, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: COLORS.greenPale,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  fotoAuswahlBereich: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  fotoVorschau: { width: 90, height: 90, borderRadius: 12 },
  fotoVorschauPlatzhalter: {
    width: 90, height: 90, borderRadius: 12, backgroundColor: COLORS.greenPale,
    alignItems: 'center', justifyContent: 'center',
  },
  fotoButtonSpalte: { flex: 1, gap: 8 },
  fotoKleinerButton: {
    backgroundColor: COLORS.cream, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  fotoKleinerButtonText: { fontSize: 13, color: COLORS.brown, fontWeight: '500' },
  chipAuswahl: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  auswahlChip: {
    borderWidth: 1.5, borderColor: COLORS.greenPale, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  auswahlChipAktiv: { backgroundColor: COLORS.greenMid, borderColor: COLORS.greenMid },
  auswahlChipText: { fontSize: 13, color: COLORS.text },
  auswahlChipTextAktiv: { color: '#fff', fontWeight: '600' },
  modalAktionen: { flexDirection: 'row', gap: 12, marginTop: 32 },
  abbrechenButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.greenPale,
  },
  abbrechenButtonText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  speichernButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: COLORS.greenMid,
  },
  speichernButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
