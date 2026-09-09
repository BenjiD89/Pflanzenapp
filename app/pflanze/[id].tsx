import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usePflanze, useGiessungen, addGiessung, updateZustand, uploadFoto, updateFotoUrl, addFeedback } from '../../src/lib/hooks';
import { COLORS, ZUSTAND_FARBE, ZUSTAND_EMOJI, ZUSTAND_OPTIONEN, WASSER_EMOJI, FEEDBACK_OPTIONEN } from '../../src/lib/constants';
import type { ZustandBewertung } from '../../src/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PflanzeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pflanze, loading, reload } = usePflanze(id);
  const { giessungen, reload: reloadGiessungen } = useGiessungen(id);
  const [giessLoading, setGiessLoading] = useState(false);
  const [fotoLoading, setFotoLoading] = useState(false);
  const [feedbackSichtbar, setFeedbackSichtbar] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  if (loading) return <ActivityIndicator size="large" color={COLORS.greenMid} style={{ flex: 1, marginTop: 80 }} />;
  if (!pflanze) return <Text style={{ margin: 32 }}>Pflanze nicht gefunden.</Text>;

  const bewertung = pflanze.zustand_bewertung ?? 'gut';
  const zustandFarbe = ZUSTAND_FARBE[bewertung] ?? COLORS.greenLight;
  const letzteGiessung = giessungen[0];
  const tageSeitzLetzter = letzteGiessung
    ? differenceInDays(new Date(), parseISO(letzteGiessung.datum))
    : null;

  async function handleGiessen() {
    setGiessLoading(true);
    const { error } = await addGiessung(id);
    if (error) Alert.alert('Fehler', error.message);
    else {
      reloadGiessungen();
      setFeedbackSichtbar(true);
    }
    setGiessLoading(false);
  }

  async function handleFeedback(typ: 'zu_feucht' | 'zu_trocken' | 'passend', delta: number) {
    setFeedbackLoading(true);
    const { error } = await addFeedback(id, typ, delta);
    setFeedbackLoading(false);
    setFeedbackSichtbar(false);
    if (error) {
      Alert.alert('Fehler', 'Feedback konnte nicht gespeichert werden.');
      return;
    }
    reload();
    Alert.alert('✅ Danke!', 'Feedback wurde gespeichert und fließt in die nächste Gieß-Empfehlung ein.');
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
      Alert.alert('Fehler', 'Foto konnte nicht hochgeladen werden.');
    }
    setFotoLoading(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Foto Header */}
      <TouchableOpacity onPress={handleFotoUpdate} activeOpacity={0.9}>
        <View style={styles.fotoBereich}>
          {pflanze.foto_url ? (
            <Image source={{ uri: pflanze.foto_url }} style={styles.foto} resizeMode="cover" />
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
        <Text style={styles.name}>{pflanze.spitzname || pflanze.name}</Text>
        {pflanze.spitzname && <Text style={styles.zweitname}>{pflanze.name}</Text>}
        <Text style={styles.art}>{pflanze.gattung} · {pflanze.art_lateinisch}</Text>

        {/* Standort */}
        <View style={styles.row}>
          <InfoChip icon="📍" label={`${pflanze.standort_zimmer ?? '–'} · ${pflanze.standort_etage ?? '–'}`} />
          <InfoChip icon="🪴" label={pflanze.standort_position ?? '–'} />
        </View>

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

        {/* Feuchte-Feedback nach dem Gießen */}
        {feedbackSichtbar && (
          <View style={[styles.card, styles.feedbackCard]}>
            <Text style={styles.cardTitle}>💧 Wie war die Erde vor dem Gießen?</Text>
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
        )}

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
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🪴 Topf</Text>
          <InfoRow label="Innendurchmesser" value={pflanze.topf_innendurchmesser_mm ? `${pflanze.topf_innendurchmesser_mm} mm` : 'noch messen'} />
          <InfoRow label="Übertopf geplant" value={pflanze.uebertopf_geplant_mm ? `${pflanze.uebertopf_geplant_mm} mm` : '–'} />
          {pflanze.topf_umtopfen_empfohlen && (
            <View style={styles.umtopfenHinweis}>
              <Text style={styles.umtopfenText}>🪴 Umtopfen empfohlen!</Text>
            </View>
          )}
        </View>

        {/* Gieß-History */}
        {giessungen.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📅 Gieß-Historie</Text>
            {giessungen.slice(0, 5).map(g => (
              <View key={g.id} style={styles.giessEntry}>
                <Text style={styles.giessDate}>
                  {format(parseISO(g.datum), 'dd. MMM yyyy', { locale: de })}
                </Text>
                {g.notiz && <Text style={styles.giessNotiz}>{g.notiz}</Text>}
              </View>
            ))}
          </View>
        )}
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
  giessEntry: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0ede6' },
  giessDate: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  giessNotiz: { fontSize: 12, color: '#6a8a6e', marginTop: 2 },
  zweitname: { fontSize: 13, color: '#8aa08e', marginTop: -4, marginBottom: 4 },
  feedbackCard: { borderWidth: 1.5, borderColor: '#2980b9' },
  feedbackRow: { flexDirection: 'column', gap: 8, marginTop: 4 },
  feedbackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.cream, borderRadius: 10, padding: 12,
  },
  feedbackIcon: { fontSize: 20 },
  feedbackLabel: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
});
