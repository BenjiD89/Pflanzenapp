export type WasserbedarfStufe = 'niedrig' | 'mittel' | 'hoch';
export type ZustandBewertung = 'sehr gut' | 'gut' | 'mittel' | 'schlecht' | 'kritisch';
export type Etage = 'Keller' | 'Erdgeschoss' | 'Obergeschoss' | 'Dachgeschoss';

export interface PflanzenKatalog {
  id: string;
  pflanzenname_de: string;
  gattung: string;
  art_lateinisch: string | null;
  herkunft: string | null;
  wasserbedarf_stufe: WasserbedarfStufe | null;
  giessintervall_sommer_tage: number | null;
  giessintervall_winter_tage: number | null;
  giessregel: string | null;
  licht: string | null;
  bewaesserungssystem_kompatibel: boolean;
  pflege_duengen: string | null;
  pflege_umtopfen: string | null;
  pflege_luftfeuchtigkeit: string | null;
  pflege_temperatur: string | null;
  pflege_typische_probleme: string[] | null;
  giftig: boolean;
  giftig_fuer: string | null;
  notizen: string | null;
  temperatur_min_c: number | null;
  temperatur_max_c: number | null;
  essbar: boolean;
  giesshaeufigkeit_pro_woche: number | null;
  sortenschutz: boolean;
  zuechter: string | null;
  webseite: string | null;
  pflanzenpass_code: string | null;
}

export interface PflanzeBestand {
  id: string;
  name: string;
  spitzname: string | null;
  art_id: string | null;
  korrektur_tage: number;
  standort_zimmer: string | null;
  standort_etage: Etage | null;
  standort_position: string | null;
  topf_innendurchmesser_mm: number | null;
  topf_zustand: string | null;
  topf_umtopfen_empfohlen: boolean;
  topf_notiz: string | null;
  uebertopf_geplant_mm: number | null;
  bewaesserungssystem: string | null;
  zustand_bewertung: ZustandBewertung | null;
  zustand_bemerkungen: string | null;
  zustand_letzte_kontrolle: string | null;
  foto_url: string | null;
  naechste_giessung: string | null;
  erstellt_am: string;
  aktualisiert_am: string;
}

// Joined view type
export interface PflanzeKomplett extends PflanzeBestand {
  pflanzenname_de: string | null;
  gattung: string | null;
  art_lateinisch: string | null;
  wasserbedarf_stufe: WasserbedarfStufe | null;
  giessintervall_sommer_tage: number | null;
  giessintervall_winter_tage: number | null;
  giessregel: string | null;
  licht: string | null;
  giftig: boolean | null;
  giftig_fuer: string | null;
  pflege_duengen: string | null;
  pflege_umtopfen: string | null;
  pflege_luftfeuchtigkeit: string | null;
  pflege_temperatur: string | null;
  pflege_typische_probleme: string[] | null;
  temperatur_min_c: number | null;
  temperatur_max_c: number | null;
  essbar: boolean | null;
  giesshaeufigkeit_pro_woche: number | null;
  sortenschutz: boolean | null;
  zuechter: string | null;
  webseite: string | null;
  pflanzenpass_code: string | null;
}

export interface Giessung {
  id: string;
  pflanze_id: string;
  datum: string;
  menge_ml: number | null;
  wassertank_aufgefuellt: boolean;
  notiz: string | null;
  erstellt_am: string;
}


// ============================================================
// V1.1: Ampel-System, Gruppen, Feedback
// ============================================================

export type AmpelStatus = 'gruen' | 'gelb' | 'rot' | 'unbekannt';
export type FeedbackTyp = 'zu_feucht' | 'zu_trocken' | 'passend';

export interface StandortGruppe {
  id: string;
  name: string;
  typ: 'innen' | 'aussen';
  etage: string | null;
  platzhalter: boolean;
  sortierung: number;
}

export interface PflanzeAmpel {
  id: string;
  name: string;
  gruppe_id: string | null;
  gruppe_name: string | null;
  letzte_giessung: string | null;
  tage_seit_giessung: number | null;
  ampel_status: AmpelStatus;
}

export interface FeedbackEintrag {
  id: string;
  pflanze_id: string;
  datum: string;
  typ: FeedbackTyp;
  korrektur_delta: number;
  notiz: string | null;
}


// ============================================================
// V1.2: Zimmer-Verwaltung, Spitzname
// ============================================================

export interface Zimmer {
  id: string;
  name: string;
  etage: string | null;
}
