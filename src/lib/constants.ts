import type { ZustandBewertung, WasserbedarfStufe, Etage } from '../types';

export const COLORS = {
  greenDeep:  '#1a3a2a',
  greenMid:   '#2d5a3d',
  greenLight: '#4a8c5c',
  greenPale:  '#a8d5b5',
  cream:      '#f5f0e8',
  warmWhite:  '#faf8f3',
  brown:      '#7a5c3a',
  accent:     '#c8a96e',
  text:       '#1a2a1e',
  danger:     '#c0392b',
  warning:    '#e67e22',
  success:    '#27ae60',
};

export const ZUSTAND_FARBE: Record<string, string> = {
  'sehr gut': '#27ae60',
  'gut':      '#4a8c5c',
  'mittel':   '#e67e22',
  'schlecht': '#c0392b',
  'kritisch': '#8e1a0e',
};

export const ZUSTAND_EMOJI: Record<string, string> = {
  'sehr gut': '🌿',
  'gut':      '✅',
  'mittel':   '⚠️',
  'schlecht': '🟠',
  'kritisch': '🔴',
};

export const WASSER_EMOJI: Record<WasserbedarfStufe, string> = {
  niedrig: '💧',
  mittel:  '💧💧',
  hoch:    '💧💧💧',
};

export const ZUSTAND_OPTIONEN: ZustandBewertung[] = [
  'sehr gut', 'gut', 'mittel', 'schlecht', 'kritisch'
];


// ============================================================
// V1.1/V1.2: Ampel-Farben, Feedback-Labels
// ============================================================

export const AMPEL_FARBE: Record<string, string> = {
  gruen: '#27ae60',
  gelb: '#e6b800',
  rot: '#c0392b',
  unbekannt: '#9aa5a0',
};

export const AMPEL_EMOJI: Record<string, string> = {
  gruen: '🟢',
  gelb: '🟡',
  rot: '🔴',
  unbekannt: '⚪',
};

export const AMPEL_LABEL: Record<string, string> = {
  gruen: 'Alles gut',
  gelb: 'Gießen möglich',
  rot: 'Gießen nötig',
  unbekannt: 'Noch nie gegossen',
};

export const FEEDBACK_OPTIONEN: { typ: 'zu_feucht' | 'zu_trocken' | 'passend'; label: string; delta: number; icon: string }[] = [
  { typ: 'zu_feucht', label: 'Erde war noch feucht', delta: 1, icon: '💦' },
  { typ: 'passend', label: 'War genau richtig', delta: 0, icon: '✅' },
  { typ: 'zu_trocken', label: 'Blätter schon gekräuselt', delta: -1, icon: '🥀' },
];


// ============================================================
// V1.3: Etagen, Ampel-Schwellenwert-Schätzung für neue Arten
// ============================================================

export const ETAGEN: Etage[] = ['Keller', 'Erdgeschoss', 'Obergeschoss', 'Dachgeschoss'];

export const WASSERBEDARF_OPTIONEN: WasserbedarfStufe[] = ['niedrig', 'mittel', 'hoch'];

// Schätzt Ampel-Schwellenwerte (Tage seit Gießen) aus einem Gieß-Intervall,
// damit neu angelegte Pflanzenarten sofort eine sinnvolle Ampel-Farbe bekommen.
export function schaetzeAmpelSchwellen(intervallTage: number | null | undefined): { gelb: number | null; rot: number | null } {
  if (!intervallTage || intervallTage <= 0) return { gelb: null, rot: null };
  return {
    gelb: Math.max(1, Math.round(intervallTage * 0.75)),
    rot: Math.round(intervallTage * 1.25),
  };
}
