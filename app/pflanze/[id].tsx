import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image, Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  usePflanze, useGiessungen, useZimmer, addGiessung, updateZustand, uploadFoto, updateFotoUrl,
  addFeedback, addZimmer, updatePflanzeDetails, deletePflanze, deleteGiessung, useSignedFotoUrl,
} from '../../src/lib/hooks';
import { COLORS, ZUSTAND_FARBE, ZUSTAND_EMOJI, ZUSTAND_OPTIONEN, WASSER_EMOJI, FEEDBACK_OPTIONEN, ETAGEN } from '../../src/lib/constants';
import { showAlert } from '../../src/lib/alert';
import type { ZustandBewertung, Etage } from '../../src/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PflanzeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pflanze, loading, reload } = usePflanze(id);
  const { giessungen, reload: reloadGiessungen } = useGiessungen(id);
  const { zimmer: zimmerListe, reload: reloadZimmer } = useZimmer();
  const [giessLoading, setGiessLoading] = useState(false);
  const [fotoLoading, setFotoLoading] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [loeschenLoading, setLoeschenLoading] = useState(false);

  const [bearbeiten, setBearbeiten] = useState(false);
  const [speichernLoading, setSpeichernLoading] = useState(false);
  const [editSpitzname, setEditSpitzname] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [giessungLoeschenId, setGiessungLoeschenId] = useState<string | null>(null);
  const [editEtage, setEditEtage] = useState<Etage>('Erdgeschoss');
  const [editZimmerName, setEditZimmerName] = useState<string>('');
  const [editNeuesZimmerModus, setEditNeuesZimmerModus] = useState(false);
  const [editNeuesZimmerName, setEditNeuesZimmerName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editTopfDurchmesser, setEditTopfDurchmesser] = useState('');
  const [editTopfZustand, setEditTopfZustand] = useState('');
  const [editTopfNotiz, setEditTopfNotiz] = useState('');
  const [editUebertopf, setEditUebertopf] = useState('');
  const [editUmtopfenEmpfohlen, setEditUmtopfenEmpfohlen] = useState(false);
  const [editBewaesserung, setEditBewaesserung] = useState('');
  const fotoUrl = useSignedFotoUrl(pflanze?.foto_url ?? null);

  if (loading) return <ActivityIndicator size="large" color={COLORS.greenMid} style={{ flex: 1, marginTop: 80 }} />;
  if (!pflanze) return <Text style={{ margin: 32 }}>Pflanze nicht gefunden.</Text>;

  const bewertung = pflanze.zustand_bewertung ?? 'gut';
  const zustandFarbe = ZUSTAND_FARBE[bewertung] ?? COLORS.greenLight;
  const letzteGiessung = giessungen[0];
  const tageSeitzLetzter = letzteGiessung
    ? differenceInDays(new Date(), parseISO(letzteGiessung.datum))
    : null;

  function bearbeitenStarten() {
    setEditSpitzname(pflanze!.spitzname ?? '');
    setEditBeschreibung(pflanze!.name ?? '');
    setEditEtage((pflanze!.standort_etage as Etage) ?? 'Erdgeschoss');
    setEditZimmerName(pflanze!.standort_zimmer ?? '');
    setEditNeuesZimmerModus(false);
    setEditNeuesZimmerName('');
    setEditPosition(pflanze!.standort_position ?? '');
    setEditTopfDurchmesser(pflanze!.topf_innendurchmesser_mm?.toString() ?? '');
    setEditTopfZustand(pflanze!.topf_zustand ?? '');
    setEditTopfNotiz(pflanze!.topf_notiz ?? '');
    setEditUebertopf(pflanze!.uebertopf_geplant_mm?.toString() ?? '');
    setEditUmtopfenEmpfohlen(pflanze!.topf_umtopfen_empfohlen ?? false);
    setEditBewaesserung(pflanze!.bewaesserungssystem ?? '');
    setBearbeiten(true);
  }

  async function bearbeitenSpeichern() {
    if (!editBeschreibung.trim()) {
      showAlert('Beschreibung fehlt', 'Bitte eine Beschreibung eingeben.');
      return;
    }

    let zimmerName = editZimmerName;
    setSpeichernLoading(true);

    if (editNeuesZimmerModus && editNeuesZimmerName.trim()) {
      const { data, error } = await addZimmer(editNeuesZimmerName.trim(), editEtage);
      if (error) {
        showAlert('Fehler', 'Zimmer konnte nicht angelegt werden.');
        setSpeichernLoading(false);
        return;
      }
      zimmerName = data.name;
      reloadZimmer();
    }

    const { error } = await updatePflanzeDetails(id, {
      name: editBeschreibung.trim(),
      spitzname: editSpitzname.trim() || null,
      standort_zimmer: zimmerName || undefined,
      standort_etage: editEtage,
      standort_position: editPosition.trim() || null,
      topf_innendurchmesser_mm: editTopfDurchmesser ? parseInt(editTopfDurchmesser, 10) : null,
      topf_zustand: editTopfZustand.trim() || null,
      topf_notiz: editTopfNotiz.trim() || null,
      topf_umtopfen_empfohlen: editUmtopfenEmpfohlen,
      uebertopf_geplant_mm: editUebertopf ? parseInt(editUebertopf, 10) : null,
      bewaesserungssystem: editBewaesserung.trim() || null,
    });

    setSpeichernLoading(false);
    if (error) {
      showAlert('Fehler', 'Änderungen konnten nicht gespeichert werden.');
      return;
    }
    setBearbeiten(false);
    reload();
  }

  function handleGiessungLoeschen(giessungId: string, datum: string) {
    showAlert(
      'Gießung löschen?',
      `Der Eintrag vom ${format(parseISO(datum), 'dd. MMM yyyy', { locale: de })} wird entfernt.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setGiessungLoeschenId(giessungId);
            const { error } = await deleteGiessung(giessungId);
            setGiessungLoeschenId(null);
            if (error) {
              showAlert('Fehler', 'Gießung konnte nicht gelöscht werden.');
              return;
            }
            reloadGiessungen();
          },
        },
      ]
    );
  }

  async function handleGiessen() {
    setGiessLoading(true);
    const { error } = await addGiessung(id);
    if (error) showAlert('Fehler', error.message);
    else reloadGiessungen();
    setGiessLoading(false);
  }

  async function handleFeedback(typ: 'zu_feucht' | 'zu_trocken' | 'passend', delta: number) {
    setFeedbackLoading(true);
    const { error } = await addFeedback(id, typ, delta);
    setFeedbackLoading(false);
    if (error) {
      showAlert('Fehler', 'Feedback konnte nicht gespeichert werden.');
      return;
    }
    reload();
    showAlert('✅ Danke!', 'Feedback wurde gespeichert und fließt in die nächste Gieß-Empfehlung ein.');
  }

  async function handleZustandUpdate(neueBewertung: ZustandBewertung) {
    Alert.prompt(
      `Zustand: ${neueBewertung}`,
      'Bemerkung (optional):',
      async (bemerkung) => {
        await updateZustand(id, neueBewertung, bemerkung ?? '');
        reload();
      },
      'plain-text',
      pflanze.zustand_bemerkungen ?? ''
    );
  }

  async function handleFotoUpdate() {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled) return;

    setFotoLoading(true);
    const uri = result.assets[0].uri;
    const url = await uploadFoto(id, uri);
    if (url) {
      await updateFotoUrl(id, url);
      reload();
    } else {
      showAlert('Fehler', 'Foto konnte nicht hochgeladen werden.');
    }
    setFotoLoading(false);
  }

  function handleLoeschen() {
    showAlert(
      'Pflanze löschen?',
      `"${pflanze.spitzname || pflanze.name}" wird unwiderruflich gelöscht, inklusive Gieß-Historie und Feedback.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            setLoeschenLoading(true);
            const { error } = await deletePflanze(id);
            setLoeschenLoading(false);
            if (error) {
              showAlert('Fehler', 'Pflanze konnte nicht gelöscht werden.');
              return;
            }
            router.replace('/');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Foto Header */}
      <TouchableOpacity onPress={handleFotoUpdate} activeOpacity={0.9}>
        <View style={styles.fotoBereich}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.foto} resizeMode="cover" />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Text style={styles.fotoIcon}>🌿</Text>
              <Text style={styles.fotoHint}>{fotoLoading ? 'Lädt...' : 'Tippen für Foto'}</Text>
            </View>
          )}
          <View style={[styles.zustandBadge, { backgroundColor: zustandFarbe }]}>
            <Text style={styles.zustandBadgeText}>{ZUSTAND_EMOJI[bewertung]} {bewertung}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Name & Art */}
        <View style={styles.nameRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{pflanze.spitzname || pflanze.name}</Text>
            {pflanze.spitzname && <Text style={styles.zweitname}>{pflanze.name}</Text>}
            <Text style={styles.art}>{pflanze.gattung} · {pflanze.art_lateinisch}</Text>
          </View>
          {!bearbeiten && (
            <TouchableOpacity style={styles.bearbeitenButton} onPress={bearbeitenStarten}>
              <Text style={styles.bearbeitenButtonText}>✏️ Bearbeiten</Text>
            </TouchableOpacity>
          )}
        </View>

        {!bearbeiten ? (
          <View style={styles.row}>
            <InfoChip icon="📍" label={`${pflanze.standort_zimmer ?? '–'} · ${pflanze.standort_etage ?? '–'}`} />
            <InfoChip icon="🪴" label={pflanze.standort_position ?? '–'} />
          </View>
        ) : (
          <View style={[styles.card, styles.editCard]}>
            <Text style={styles.cardTitle}>✏️ Pflanze bearbeiten</Text>

            <Text style={styles.feldLabelKlein}>Spitzname</Text>
            <TextInput style={styles.editInput} value={editSpitzname} onChangeText={setEditSpitzname} placeholder="z.B. Frieda" />

            <Text style={styles.feldLabelKlein}>Beschreibung</Text>
            <TextInput style={styles.editInput} value={editBeschreibung} onChangeText={setEditBeschreibung} placeholder="z.B. Monstera Küche" />

            <View style={styles.trennlinie} />

            <Text style={styles.feldLabelKlein}>Etage / Stockwerk</Text>
            <View style={styles.chipReihe}>
              {ETAGEN.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.editChip, editEtage === e && styles.editChipAktiv]}
                  onPress={() => setEditEtage(e)}
                >
                  <Text style={[styles.editChipText, editEtage === e && styles.editChipTextAktiv]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.feldLabelKlein}>Zimmer</Text>
            <View style={styles.chipReihe}>
              {zimmerListe.map(z => (
                <TouchableOpacity
                  key={z.id}
                  style={[styles.editChip, editZimmerName === z.name && !editNeuesZimmerModus && styles.editChipAktiv]}
                  onPress={() => {
                    setEditZimmerName(z.name);
                    setEditNeuesZimmerModus(false);
                    if (z.etage) setEditEtage(z.etage as Etage);
                  }}
                >
                  <Text style={[styles.editChipText, editZimmerName === z.name && !editNeuesZimmerModus && styles.editChipTextAktiv]}>
                    {z.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.editChip, editNeuesZimmerModus && styles.editChipAktiv]}
                onPress={() => setEditNeuesZimmerModus(true)}
              >
                <Text style={[styles.editChipText, editNeuesZimmerModus && styles.editChipTextAktiv]}>➕ Neu</Text>
              </TouchableOpacity>
            </View>
            {editNeuesZimmerModus && (
              <TextInput
                style={styles.editInput}
                value={editNeuesZimmerName}
                onChangeText={setEditNeuesZimmerName}
                placeholder="Name des neuen Zimmers"
              />
            )}

            <Text style={styles.feldLabelKlein}>Position im Raum</Text>
            <TextInput style={styles.editInput} value={editPosition} onChangeText={setEditPosition} placeholder="z.B. Fensterbank" />

            <View style={styles.trennlinie} />

            <View style={styles.zeile2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.feldLabelKlein}>Topf-Innendurchmesser (mm)</Text>
                <TextInput style={styles.editInput} value={editTopfDurchmesser} onChangeText={setEditTopfDurchmesser} placeholder="z.B. 200" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.feldLabelKlein}>Übertopf geplant (mm)</Text>
                <TextInput style={styles.editInput} value={editUebertopf} onChangeText={setEditUebertopf} placeholder="z.B. 250" keyboardType="numeric" />
              </View>
            </View>

            <Text style={styles.feldLabelKlein}>Topf-Zustand / Beschreibung</Text>
            <TextInput style={styles.editInput} value={editTopfZustand} onChangeText={setEditTopfZustand} placeholder="z.B. grauer Keramiktopf" />

            <Text style={styles.feldLabelKlein}>Topf-Notiz</Text>
            <TextInput style={styles.editInput} value={editTopfNotiz} onChangeText={setEditTopfNotiz} placeholder="Sonstige Notizen zum Topf" />

            <Text style={styles.feldLabelKlein}>Bewässerungssystem</Text>
            <TextInput style={styles.editInput} value={editBewaesserung} onChangeText={setEditBewaesserung} placeholder="z.B. Dochtsystem" />

            <View style={styles.switchRow}>
              <Text style={styles.feldLabelKlein}>Umtopfen empfohlen</Text>
              <Switch value={editUmtopfenEmpfohlen} onValueChange={setEditUmtopfenEmpfohlen} trackColor={{ true: COLORS.greenMid }} />
            </View>

            <View style={styles.modalAktionen}>
              <TouchableOpacity style={styles.abbrechenButton} onPress={() => setBearbeiten(false)} disabled={speichernLoading}>
                <Text style={styles.abbrechenButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.speichernButton} onPress={bearbeitenSpeichern} disabled={speichernLoading}>
                <Text style={styles.speichernButtonText}>{speichernLoading ? 'Speichert...' : 'Speichern'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Gießen Button */}
        <TouchableOpacity
          style={styles.giessButton}
          onPress={handleGiessen}
          disabled={giessLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.giessButtonText}>
            {giessLoading ? 'Wird eingetragen...' : '💧 Jetzt gegossen!'}
          </Text>
        </TouchableOpacity>

        {/* Feuchte-Feedback / Korrektur des Gieß-Rhythmus */}
        <View style={[styles.card, styles.feedbackCard]}>
          <Text style={styles.cardTitle}>💧 Feedback zur Erdfeuchte</Text>
          <Text style={styles.feedbackHint}>
            Verschiebt den Gieß-Rhythmus dieser Pflanze für zukünftige Empfehlungen.
          </Text>
          <View style={styles.feedbackRow}>
            {FEEDBACK_OPTIONEN.map(opt => (
              <TouchableOpacity
                key={opt.typ}
                style={styles.feedbackBtn}
                onPress={() => handleFeedback(opt.typ, opt.delta)}
                disabled={feedbackLoading}
              >
                <Text style={styles.feedbackIcon}>{opt.icon}</Text>
                <Text style={styles.feedbackLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gieß-Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💧 Bewässerung</Text>
          <InfoRow label="Wasserbedarf" value={pflanze.wasserbedarf_stufe ? `${WASSER_EMOJI[pflanze.wasserbedarf_stufe]} ${pflanze.wasserbedarf_stufe}` : '–'} />
          <InfoRow label="Intervall Sommer" value={pflanze.giessintervall_sommer_tage ? `alle ${pflanze.giessintervall_sommer_tage} Tage` : '–'} />
          <InfoRow label="Intervall Winter" value={pflanze.giessintervall_winter_tage ? `alle ${pflanze.giessintervall_winter_tage} Tage` : '–'} />
          <InfoRow label="System" value={pflanze.bewaesserungssystem ?? '–'} />
          {letzteGiessung && (
            <InfoRow
              label="Zuletzt gegossen"
              value={`${format(parseISO(letzteGiessung.datum), 'dd. MMM yyyy', { locale: de })} (vor ${tageSeitzLetzter} Tagen)`}
            />
          )}
          {pflanze.giessregel && (
            <Text style={styles.giessregel}>{pflanze.giessregel}</Text>
          )}
        </View>

        {/* Zustand updaten */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Zustand aktualisieren</Text>
          {pflanze.zustand_bemerkungen && (
            <Text style={styles.bemerkung}>„{pflanze.zustand_bemerkungen}"</Text>
          )}
          <View style={styles.zustandGrid}>
            {ZUSTAND_OPTIONEN.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.zustandBtn,
                  { borderColor: ZUSTAND_FARBE[opt] },
                  bewertung === opt && { backgroundColor: ZUSTAND_FARBE[opt] }
                ]}
                onPress={() => handleZustandUpdate(opt)}
              >
                <Text style={[
                  styles.zustandBtnText,
                  { color: bewertung === opt ? '#fff' : ZUSTAND_FARBE[opt] }
                ]}>
                  {ZUSTAND_EMOJI[opt]} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pflegehinweise */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌱 Pflegehinweise</Text>
          <InfoRow label="Licht" value={pflanze.licht ?? '–'} />
          <InfoRow label="Temperatur" value={pflanze.pflege_temperatur ?? '–'} />
          <InfoRow label="Luftfeuchtigkeit" value={pflanze.pflege_luftfeuchtigkeit ?? '–'} />
          <InfoRow label="Düngen" value={pflanze.pflege_duengen ?? '–'} />
          <InfoRow label="Umtopfen" value={pflanze.pflege_umtopfen ?? '–'} />
          {pflanze.giftig && (
            <View style={styles.giftWarnung}>
              <Text style={styles.giftText}>⚠️ Giftig: {pflanze.giftig_fuer}</Text>
            </View>
          )}
          {pflanze.pflege_typische_probleme && pflanze.pflege_typische_probleme.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.problemeTitel}>Typische Probleme:</Text>
              {pflanze.pflege_typische_probleme.map((p, i) => (
                <Text key={i} style={styles.problemePunkt}>• {p}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Topf-Info */}
        {!bearbeiten && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🪴 Topf</Text>
            <InfoRow label="Innendurchmesser" value={pflanze.topf_innendurchmesser_mm ? `${pflanze.topf_innendurchmesser_mm} mm` : 'noch messen'} />
            <InfoRow label="Zustand" value={pflanze.topf_zustand ?? '–'} />
            <InfoRow label="Übertopf geplant" value={pflanze.uebertopf_geplant_mm ? `${pflanze.uebertopf_geplant_mm} mm` : '–'} />
            {pflanze.topf_notiz && <Text style={styles.giessregel}>{pflanze.topf_notiz}</Text>}
            {pflanze.topf_umtopfen_empfohlen && (
              <View style={styles.umtopfenHinweis}>
                <Text style={styles.umtopfenText}>🪴 Umtopfen empfohlen!</Text>
              </View>
            )}
          </View>
        )}

        {/* Gieß-History */}
        {giessungen.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Gieß-Historie</Text>
            {giessungen.slice(0, 5).map(g => (
              <View key={g.id} style={styles.giessEntryRow}>
                <View style={styles.giessEntry}>
                  <Text style={styles.giessDate}>
                    {format(parseISO(g.datum), 'dd. MMM yyyy', { locale: de })}
                  </Text>
                  {g.notiz && <Text style={styles.giessNotiz}>{g.notiz}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.giessLoeschenButton}
                  onPress={() => handleGiessungLoeschen(g.id, g.datum)}
                  disabled={giessungLoeschenId === g.id}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.giessLoeschenIcon}>{giessungLoeschenId === g.id ? '…' : '🗑'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Löschen */}
        <TouchableOpacity
          style={styles.loeschenButton}
          onPress={handleLoeschen}
          disabled={loeschenLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.loeschenButtonText}>
            {loeschenLoading ? 'Wird gelöscht...' : '🗑 Pflanze löschen'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText}>{icon} {label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.warmWhite },
  fotoBereich: { height: 240, backgroundColor: COLORS.greenDeep, position: 'relative' },
  foto: { width: '100%', height: '100%' },
  fotoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fotoIcon: { fontSize: 64 },
  fotoHint: { color: COLORS.greenPale, marginTop: 8, fontSize: 13 },
  zustandBadge: {
    position: 'absolute', bottom: 16, right: 16,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  zustandBadgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  content: { padding: 20 },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  art: { fontSize: 14, color: '#6a8a6e', fontStyle: 'italic', marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: { backgroundColor: COLORS.cream, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  infoChipText: { fontSize: 13, color: COLORS.brown },
  giessButton: {
    backgroundColor: '#2980b9', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  giessButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.greenDeep, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0ede6' },
  infoLabel: { fontSize: 13, color: '#6a8a6e', flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.text, flex: 2, textAlign: 'right' },
  giessregel: { marginTop: 12, fontSize: 13, color: '#4a6a4e', fontStyle: 'italic', lineHeight: 20 },
  bemerkung: { fontSize: 13, color: '#6a8a6e', fontStyle: 'italic', marginBottom: 12 },
  zustandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  zustandBtn: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  zustandBtnText: { fontSize: 12, fontWeight: '600' },
  giftWarnung: { backgroundColor: 'rgba(192,57,43,0.1)', borderRadius: 8, padding: 10, marginTop: 12 },
  giftText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  problemeTitel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  problemePunkt: { fontSize: 13, color: '#4a5a4e', lineHeight: 22 },
  umtopfenHinweis: { backgroundColor: 'rgba(230,126,34,0.1)', borderRadius: 8, padding: 10, marginTop: 12 },
  umtopfenText: { color: COLORS.warning, fontSize: 13, fontWeight: '600' },
  giessEntryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f0ede6',
  },
  giessEntry: { paddingVertical: 8, flex: 1 },
  giessDate: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  giessNotiz: { fontSize: 12, color: '#6a8a6e', marginTop: 2 },
  giessLoeschenButton: { paddingHorizontal: 10, paddingVertical: 8 },
  giessLoeschenIcon: { fontSize: 15, opacity: 0.6 },
  zweitname: { fontSize: 13, color: '#8aa08e', marginTop: -4, marginBottom: 4 },
  feedbackCard: { borderWidth: 1.5, borderColor: '#2980b9' },
  feedbackHint: { fontSize: 12, color: '#6a8a6e', marginBottom: 10 },
  feedbackRow: { flexDirection: 'column', gap: 8, marginTop: 4 },
  feedbackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.cream, borderRadius: 10, padding: 12,
  },
  feedbackIcon: { fontSize: 20 },
  feedbackLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },

  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bearbeitenButton: {
    backgroundColor: COLORS.cream, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  bearbeitenButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.brown },
  editCard: { borderWidth: 1.5, borderColor: COLORS.greenMid, marginTop: 4 },
  feldLabelKlein: { fontSize: 12, fontWeight: '600', color: COLORS.greenDeep, marginBottom: 6, marginTop: 12 },
  chipReihe: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  editChip: {
    borderWidth: 1.5, borderColor: COLORS.greenPale, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  editChipAktiv: { backgroundColor: COLORS.greenMid, borderColor: COLORS.greenMid },
  editChipText: { fontSize: 12, color: COLORS.text },
  editChipTextAktiv: { color: '#fff', fontWeight: '600' },
  editInput: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: COLORS.greenPale,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  trennlinie: { height: 1, backgroundColor: '#f0ede6', marginVertical: 14 },
  zeile2: { flexDirection: 'row', gap: 12 },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14,
  },
  modalAktionen: { flexDirection: 'row', gap: 12, marginTop: 20 },
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

  loeschenButton: {
    marginTop: 8, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.danger,
  },
  loeschenButtonText: { color: COLORS.danger, fontSize: 14, fontWeight: '600' },
});
