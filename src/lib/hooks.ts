import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { PflanzeKomplett, Giessung, ZustandBewertung } from '../types';

// Alle Pflanzen laden (via View)
export function usePflanzen() {
  const [pflanzen, setPflanzen] = useState<PflanzeKomplett[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('v_pflanzen_komplett')
      .select('*')
      .order('standort_zimmer', { nullsFirst: false })
      .order('name');

    if (error) setError(error.message);
    else setPflanzen(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { pflanzen, loading, error, reload: load };
}

// Einzelne Pflanze laden
export function usePflanze(id: string) {
  const [pflanze, setPflanze] = useState<PflanzeKomplett | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('v_pflanzen_komplett')
      .select('*')
      .eq('id', id)
      .single();
    setPflanze(data ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  return { pflanze, loading, reload: load };
}

// Gießungen einer Pflanze laden
export function useGiessungen(pflanzeId: string) {
  const [giessungen, setGiessungen] = useState<Giessung[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('giessungen')
      .select('*')
      .eq('pflanze_id', pflanzeId)
      .order('datum', { ascending: false })
      .limit(20);
    setGiessungen(data ?? []);
    setLoading(false);
  }, [pflanzeId]);

  useEffect(() => { load(); }, [load]);
  return { giessungen, loading, reload: load };
}

// Gießung löschen (z.B. wenn versehentlich eingetragen)
export async function deleteGiessung(giessungId: string) {
  const { error } = await supabase.from('giessungen').delete().eq('id', giessungId);
  return { error };
}

// Gießung hinzufügen
export async function addGiessung(
  pflanzeId: string,
  opts?: { menge_ml?: number; wassertank_aufgefuellt?: boolean; notiz?: string }
) {
  const { error } = await supabase.from('giessungen').insert({
    pflanze_id: pflanzeId,
    datum: new Date().toISOString().split('T')[0],
    menge_ml: opts?.menge_ml ?? null,
    wassertank_aufgefuellt: opts?.wassertank_aufgefuellt ?? false,
    notiz: opts?.notiz ?? null,
  });
  return { error };
}

// Zustand updaten
export async function updateZustand(
  pflanzeId: string,
  bewertung: ZustandBewertung,
  bemerkungen: string
) {
  const { error } = await supabase
    .from('pflanzen_bestand')
    .update({
      zustand_bewertung: bewertung,
      zustand_bemerkungen: bemerkungen,
      zustand_letzte_kontrolle: new Date().toISOString().split('T')[0],
    })
    .eq('id', pflanzeId);
  return { error };
}

// Foto-URL updaten
export async function updateFotoUrl(pflanzeId: string, fotoUrl: string) {
  const { error } = await supabase
    .from('pflanzen_bestand')
    .update({ foto_url: fotoUrl })
    .eq('id', pflanzeId);
  return { error };
}

// Pflanze löschen (Gießungen/Feedback werden per ON DELETE CASCADE mitgelöscht)
export async function deletePflanze(pflanzeId: string) {
  const { error } = await supabase
    .from('pflanzen_bestand')
    .delete()
    .eq('id', pflanzeId);
  return { error };
}

// Foto zu Supabase Storage hochladen. Der Bucket "fotos" ist PRIVAT - es gibt
// keine öffentliche URL. Zurückgegeben wird der Storage-Pfad; die Spalte
// pflanzen_bestand.foto_url speichert diesen Pfad (kein Public-URL-String
// mehr). Zum Anzeigen wird daraus per useSignedFotoUrl() eine zeitlich
// befristete signierte URL erzeugt.
export async function uploadFoto(pflanzeId: string, localUri: string): Promise<string | null> {
  const ext = localUri.split('.').pop() ?? 'jpg';
  const path = `pflanzen/${pflanzeId}_${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append('file', { uri: localUri, name: path, type: `image/${ext}` } as any);

  const { data, error } = await supabase.storage
    .from('fotos')
    .upload(path, formData, { upsert: true });

  if (error || !data) return null;
  return data.path;
}

// Signierte, zeitlich befristete URL für ein Foto aus dem privaten "fotos"-
// Bucket auflösen. path ist der in pflanzen_bestand.foto_url gespeicherte
// Storage-Pfad (nicht die alte öffentliche URL).
export function useSignedFotoUrl(path: string | null, gueltigkeitSekunden = 3600) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let aktiv = true;
    if (!path) {
      setUrl(null);
      return;
    }
    // Bereits eine (alte) voll ausgeschriebene URL? Dann nicht erneut auflösen.
    if (path.startsWith('http')) {
      setUrl(path);
      return;
    }
    (async () => {
      const { data } = await supabase.storage.from('fotos').createSignedUrl(path, gueltigkeitSekunden);
      if (aktiv) setUrl(data?.signedUrl ?? null);
    })();
    return () => { aktiv = false; };
  }, [path, gueltigkeitSekunden]);

  return url;
}


// ============================================================
// V1.2: Zimmer verwalten, neue Pflanze anlegen
// ============================================================

export function useZimmer() {
  const [zimmer, setZimmer] = useState<{ id: string; name: string; etage: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('zimmer').select('*').order('name');
    setZimmer(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { zimmer, loading, reload: load };
}

export async function addZimmer(name: string, etage: string) {
  const { data, error } = await supabase
    .from('zimmer')
    .insert({ name, etage })
    .select()
    .single();
  return { data, error };
}

export async function addPflanze(pflanze: {
  id: string;
  name: string;
  spitzname: string;
  art_id: string;
  standort_zimmer: string;
  standort_etage: string;
  standort_position?: string;
  topf_innendurchmesser_mm?: number;
  gruppe_id?: string;
}) {
  const { error } = await supabase.from('pflanzen_bestand').insert({
    id: pflanze.id,
    name: pflanze.name,
    spitzname: pflanze.spitzname,
    art_id: pflanze.art_id,
    standort_zimmer: pflanze.standort_zimmer,
    standort_etage: pflanze.standort_etage,
    standort_position: pflanze.standort_position ?? null,
    topf_innendurchmesser_mm: pflanze.topf_innendurchmesser_mm ?? null,
    gruppe_id: pflanze.gruppe_id ?? null,
    zustand_bewertung: 'gut',
    zustand_letzte_kontrolle: new Date().toISOString().split('T')[0],
  });
  return { error };
}

// Neue Pflanzenart anlegen (wenn die gewünschte Art noch nicht im Katalog ist)
export async function addArt(art: {
  pflanzenname_de: string;
  gattung: string;
  art_lateinisch?: string | null;
  herkunft?: string | null;
  wasserbedarf_stufe?: 'niedrig' | 'mittel' | 'hoch';
  giessintervall_sommer_tage?: number | null;
  giessintervall_winter_tage?: number | null;
  giessregel?: string | null;
  licht?: string | null;
  pflege_duengen?: string | null;
  pflege_umtopfen?: string | null;
  pflege_luftfeuchtigkeit?: string | null;
  pflege_temperatur?: string | null;
  pflege_typische_probleme?: string[] | null;
  giftig?: boolean;
  giftig_fuer?: string | null;
  notizen?: string | null;
  temperatur_min_c?: number | null;
  temperatur_max_c?: number | null;
  essbar?: boolean;
  giesshaeufigkeit_pro_woche?: number | null;
  sortenschutz?: boolean;
  zuechter?: string | null;
  webseite?: string | null;
  pflanzenpass_code?: string | null;
  gelb_ab_tage_sommer?: number | null;
  rot_ab_tage_sommer?: number | null;
  gelb_ab_tage_winter?: number | null;
  rot_ab_tage_winter?: number | null;
}) {
  const id = 'art' + Date.now().toString().slice(-6);
  const { data, error } = await supabase
    .from('pflanzen_katalog')
    .insert({
      id,
      pflanzenname_de: art.pflanzenname_de,
      gattung: art.gattung,
      art_lateinisch: art.art_lateinisch ?? null,
      herkunft: art.herkunft ?? null,
      wasserbedarf_stufe: art.wasserbedarf_stufe ?? null,
      giessintervall_sommer_tage: art.giessintervall_sommer_tage ?? null,
      giessintervall_winter_tage: art.giessintervall_winter_tage ?? null,
      giessregel: art.giessregel ?? null,
      licht: art.licht ?? null,
      pflege_duengen: art.pflege_duengen ?? null,
      pflege_umtopfen: art.pflege_umtopfen ?? null,
      pflege_luftfeuchtigkeit: art.pflege_luftfeuchtigkeit ?? null,
      pflege_temperatur: art.pflege_temperatur ?? null,
      pflege_typische_probleme: art.pflege_typische_probleme ?? null,
      giftig: art.giftig ?? false,
      giftig_fuer: art.giftig_fuer ?? null,
      notizen: art.notizen ?? null,
      temperatur_min_c: art.temperatur_min_c ?? null,
      temperatur_max_c: art.temperatur_max_c ?? null,
      essbar: art.essbar ?? true,
      giesshaeufigkeit_pro_woche: art.giesshaeufigkeit_pro_woche ?? null,
      sortenschutz: art.sortenschutz ?? false,
      zuechter: art.zuechter ?? null,
      webseite: art.webseite ?? null,
      pflanzenpass_code: art.pflanzenpass_code ?? null,
      gelb_ab_tage_sommer: art.gelb_ab_tage_sommer ?? null,
      rot_ab_tage_sommer: art.rot_ab_tage_sommer ?? null,
      gelb_ab_tage_winter: art.gelb_ab_tage_winter ?? null,
      rot_ab_tage_winter: art.rot_ab_tage_winter ?? null,
    })
    .select()
    .single();
  return { data, error };
}

// KI-Recherche für eine neue Pflanzenart (Edge Function "lookup-pflanzenart")
export interface KiPflanzenartVorschlag {
  pflanzenname_de: string;
  gattung: string;
  art_lateinisch: string | null;
  herkunft: string | null;
  wasserbedarf_stufe: 'niedrig' | 'mittel' | 'hoch';
  giessintervall_sommer_tage: number | null;
  giessintervall_winter_tage: number | null;
  giessregel: string | null;
  licht: string | null;
  pflege_duengen: string | null;
  pflege_umtopfen: string | null;
  pflege_luftfeuchtigkeit: string | null;
  pflege_temperatur: string | null;
  pflege_typische_probleme: string[];
  giftig: boolean;
  giftig_fuer: string | null;
  temperatur_min_c: number | null;
  temperatur_max_c: number | null;
  essbar: boolean;
  giesshaeufigkeit_pro_woche: number | null;
  notizen: string | null;
  quellen: string[];
}

export async function kiPflanzenartRecherche(input: {
  name: string;
  gattung?: string;
  art_lateinisch?: string;
}): Promise<{ data: KiPflanzenartVorschlag | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('lookup-pflanzenart', {
    body: input,
  });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data: data?.data ?? null, error: null };
}

// Standort- und Topf-Attribute einer Pflanze aktualisieren (ändern sich über die Zeit,
// z.B. beim Umtopfen oder Umzug in ein anderes Zimmer)
export async function updatePflanzeDetails(pflanzeId: string, updates: Partial<{
  name: string;
  spitzname: string | null;
  standort_zimmer: string;
  standort_etage: string;
  standort_position: string | null;
  topf_innendurchmesser_mm: number | null;
  topf_zustand: string | null;
  topf_notiz: string | null;
  topf_umtopfen_empfohlen: boolean;
  uebertopf_geplant_mm: number | null;
  bewaesserungssystem: string | null;
}>) {
  const { error } = await supabase
    .from('pflanzen_bestand')
    .update(updates)
    .eq('id', pflanzeId);
  return { error };
}

// Katalog (Arten) laden - für Dropdown im "neue Pflanze"-Formular
export function useKatalog() {
  const [katalog, setKatalog] = useState<{ id: string; pflanzenname_de: string; gattung: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('pflanzen_katalog').select('id, pflanzenname_de, gattung').order('pflanzenname_de');
      setKatalog(data ?? []);
      setLoading(false);
    })();
  }, []);

  return { katalog, loading };
}


// ============================================================
// V1.1: Ampel-Übersicht, Gruppen, Batch-Gießen, Feedback
// ============================================================

export function useGruppen() {
  const [gruppen, setGruppen] = useState<StandortGruppe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('standort_gruppen').select('*').order('sortierung');
    setGruppen(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { gruppen, loading, reload: load };
}

export function usePflanzenAmpel() {
  const [pflanzen, setPflanzen] = useState<PflanzeAmpel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('v_pflanzen_ampel').select('*');
    if (!error) setPflanzen(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { pflanzen, loading, reload: load };
}

// Mehrere Pflanzen auf einmal gießen (z.B. ganzes Stockwerk)
export async function addGiessungBatch(pflanzeIds: string[]) {
  const heute = new Date().toISOString().split('T')[0];
  const rows = pflanzeIds.map(id => ({ pflanze_id: id, datum: heute }));
  const { error } = await supabase.from('giessungen').insert(rows);
  return { error };
}

// Feuchte-Feedback abgeben -> verschiebt korrektur_tage der Pflanze
export async function addFeedback(
  pflanzeId: string,
  typ: 'zu_feucht' | 'zu_trocken' | 'passend',
  delta: number
) {
  const { error: e1 } = await supabase.from('feedback_log').insert({
    pflanze_id: pflanzeId,
    typ,
    korrektur_delta: delta,
  });
  if (e1) return { error: e1 };

  // aktuellen Korrekturwert holen und verschieben
  const { data: current } = await supabase
    .from('pflanzen_bestand')
    .select('korrektur_tage')
    .eq('id', pflanzeId)
    .single();

  const neuerWert = (current?.korrektur_tage ?? 0) + delta;
  const { error: e2 } = await supabase
    .from('pflanzen_bestand')
    .update({ korrektur_tage: neuerWert })
    .eq('id', pflanzeId);

  return { error: e2 };
}
