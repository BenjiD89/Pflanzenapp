-- ============================================================
-- Pflanzen-App Supabase Schema
-- Version: 1.0.0
-- ============================================================

-- Pflanzenarten / Katalog
CREATE TABLE pflanzen_katalog (
  id                          TEXT PRIMARY KEY,           -- z.B. 'art001'
  pflanzenname_de             TEXT NOT NULL,
  gattung                     TEXT NOT NULL,
  art_lateinisch              TEXT,
  herkunft                    TEXT,
  wasserbedarf_stufe          TEXT CHECK (wasserbedarf_stufe IN ('niedrig', 'mittel', 'hoch')),
  giessintervall_sommer_tage  INTEGER,
  giessintervall_winter_tage  INTEGER,
  giessregel                  TEXT,
  licht                       TEXT,
  bewaesserungssystem_kompatibel BOOLEAN DEFAULT true,
  -- Pflegehinweise (flach als Spalten)
  pflege_duengen              TEXT,
  pflege_umtopfen             TEXT,
  pflege_luftfeuchtigkeit     TEXT,
  pflege_temperatur           TEXT,
  pflege_typische_probleme    TEXT[],   -- Array von Strings
  giftig                      BOOLEAN DEFAULT false,
  giftig_fuer                 TEXT,
  notizen                     TEXT,
  erstellt_am                 TIMESTAMPTZ DEFAULT NOW()
);

-- Pflanzen-Bestand
CREATE TABLE pflanzen_bestand (
  id                          TEXT PRIMARY KEY,           -- z.B. 'p001'
  name                        TEXT NOT NULL,
  art_id                      TEXT REFERENCES pflanzen_katalog(id),
  -- Standort
  standort_zimmer             TEXT,
  standort_etage              TEXT CHECK (standort_etage IN ('Keller', 'Erdgeschoss', 'Obergeschoss', 'Dachgeschoss')),
  standort_position           TEXT,
  -- Topf
  topf_innendurchmesser_mm    INTEGER,
  topf_zustand                TEXT,
  topf_umtopfen_empfohlen     BOOLEAN DEFAULT false,
  topf_notiz                  TEXT,
  uebertopf_geplant_mm        INTEGER,
  bewaesserungssystem         TEXT,
  -- Zustand (strukturiert)
  zustand_bewertung           TEXT CHECK (zustand_bewertung IN ('sehr gut', 'gut', 'mittel', 'schlecht', 'kritisch')),
  zustand_bemerkungen         TEXT,
  zustand_letzte_kontrolle    DATE,
  -- Foto
  foto_url                    TEXT,
  -- Gieß-Tracking
  naechste_giessung           DATE,
  -- Meta
  erstellt_am                 TIMESTAMPTZ DEFAULT NOW(),
  aktualisiert_am             TIMESTAMPTZ DEFAULT NOW()
);

-- Gieß-Log
CREATE TABLE giessungen (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pflanze_id                  TEXT NOT NULL REFERENCES pflanzen_bestand(id) ON DELETE CASCADE,
  datum                       DATE NOT NULL DEFAULT CURRENT_DATE,
  menge_ml                    INTEGER,
  wassertank_aufgefuellt      BOOLEAN DEFAULT false,
  notiz                       TEXT,
  erstellt_am                 TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_giessungen_pflanze_id ON giessungen(pflanze_id);
CREATE INDEX idx_giessungen_datum ON giessungen(datum DESC);
CREATE INDEX idx_bestand_etage ON pflanzen_bestand(standort_etage);
CREATE INDEX idx_bestand_zimmer ON pflanzen_bestand(standort_zimmer);

-- Trigger: aktualisiert_am automatisch updaten
CREATE OR REPLACE FUNCTION update_aktualisiert_am()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bestand_aktualisiert
  BEFORE UPDATE ON pflanzen_bestand
  FOR EACH ROW EXECUTE FUNCTION update_aktualisiert_am();

-- View: Bestand mit Art-Infos (nützlich für die App)
-- Hinweis: spitzname/korrektur_tage/gruppe_id kommen erst mit den Erweiterungen
-- weiter unten dazu - die View wird dort per CREATE OR REPLACE VIEW ergänzt.
CREATE VIEW v_pflanzen_komplett AS
SELECT
  b.id,
  b.name,
  b.art_id,
  k.pflanzenname_de,
  k.gattung,
  k.art_lateinisch,
  k.wasserbedarf_stufe,
  k.giessintervall_sommer_tage,
  k.giessintervall_winter_tage,
  k.giessregel,
  k.licht,
  k.giftig,
  k.giftig_fuer,
  k.pflege_duengen,
  k.pflege_umtopfen,
  k.pflege_luftfeuchtigkeit,
  k.pflege_temperatur,
  k.pflege_typische_probleme,
  b.standort_zimmer,
  b.standort_etage,
  b.standort_position,
  b.topf_innendurchmesser_mm,
  b.topf_zustand,
  b.topf_umtopfen_empfohlen,
  b.topf_notiz,
  b.uebertopf_geplant_mm,
  b.bewaesserungssystem,
  b.zustand_bewertung,
  b.zustand_bemerkungen,
  b.zustand_letzte_kontrolle,
  b.foto_url,
  b.naechste_giessung,
  b.aktualisiert_am
FROM pflanzen_bestand b
LEFT JOIN pflanzen_katalog k ON b.art_id = k.id;

-- Row Level Security (für spätere Auth)
ALTER TABLE pflanzen_katalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE pflanzen_bestand ENABLE ROW LEVEL SECURITY;
ALTER TABLE giessungen ENABLE ROW LEVEL SECURITY;

-- Für jetzt: alle Zugriffe erlauben (anon key reicht)
CREATE POLICY "public_read_katalog" ON pflanzen_katalog FOR SELECT USING (true);
CREATE POLICY "public_all_bestand" ON pflanzen_bestand FOR ALL USING (true);
CREATE POLICY "public_all_giessungen" ON giessungen FOR ALL USING (true);


-- ============================================================
-- ERWEITERUNG V1.1: Ampel-System, Standort-Gruppen, Feedback
-- ============================================================

-- Ampel-Schwellenwerte je Art (ergänzt Katalog)
ALTER TABLE pflanzen_katalog
  ADD COLUMN gelb_ab_tage_sommer INTEGER,
  ADD COLUMN rot_ab_tage_sommer INTEGER,
  ADD COLUMN gelb_ab_tage_winter INTEGER,
  ADD COLUMN rot_ab_tage_winter INTEGER;

-- Individueller Korrekturwert je Pflanze (verschiebt Schwellen, + = später gießen, - = früher)
ALTER TABLE pflanzen_bestand
  ADD COLUMN korrektur_tage INTEGER DEFAULT 0;

-- Standort-Gruppen (für Batch-Gießen, z.B. "Erdgeschoss", "Draußen Balkon OG1")
CREATE TABLE standort_gruppen (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  typ         TEXT CHECK (typ IN ('innen', 'aussen')),
  etage       TEXT,
  platzhalter BOOLEAN DEFAULT false,
  sortierung  INTEGER DEFAULT 0
);

-- Zuordnung Pflanze <-> Gruppe (many-to-many, falls eine Pflanze mal umzieht reicht ein Update)
ALTER TABLE pflanzen_bestand
  ADD COLUMN gruppe_id TEXT REFERENCES standort_gruppen(id);

-- Feuchte-Feedback Log: verschiebt korrektur_tage schrittweise
CREATE TABLE feedback_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pflanze_id     TEXT NOT NULL REFERENCES pflanzen_bestand(id) ON DELETE CASCADE,
  datum          DATE NOT NULL DEFAULT CURRENT_DATE,
  typ            TEXT CHECK (typ IN ('zu_feucht', 'zu_trocken', 'passend')),
  korrektur_delta INTEGER,  -- z.B. +1 (zu_feucht -> später gießen) oder -1 (zu_trocken -> früher gießen)
  notiz          TEXT,
  erstellt_am    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_pflanze_id ON feedback_log(pflanze_id);
CREATE INDEX idx_bestand_gruppe_id ON pflanzen_bestand(gruppe_id);

ALTER TABLE standort_gruppen ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_gruppen" ON standort_gruppen FOR SELECT USING (true);
CREATE POLICY "public_all_feedback" ON feedback_log FOR ALL USING (true);

-- Funktion: berechnet Ampel-Status einer Pflanze basierend auf letzter Gießung + Jahreszeit + Korrektur
CREATE OR REPLACE FUNCTION berechne_ampel_status(
  p_pflanze_id TEXT
) RETURNS TEXT AS $$
DECLARE
  v_letzte_giessung DATE;
  v_tage_seit INTEGER;
  v_ist_sommer BOOLEAN;
  v_gelb_ab INTEGER;
  v_rot_ab INTEGER;
  v_korrektur INTEGER;
BEGIN
  SELECT MAX(datum) INTO v_letzte_giessung FROM giessungen WHERE pflanze_id = p_pflanze_id;
  IF v_letzte_giessung IS NULL THEN RETURN 'unbekannt'; END IF;

  v_tage_seit := CURRENT_DATE - v_letzte_giessung;
  v_ist_sommer := EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN 4 AND 9;

  SELECT b.korrektur_tage,
         CASE WHEN v_ist_sommer THEN k.gelb_ab_tage_sommer ELSE k.gelb_ab_tage_winter END,
         CASE WHEN v_ist_sommer THEN k.rot_ab_tage_sommer ELSE k.rot_ab_tage_winter END
  INTO v_korrektur, v_gelb_ab, v_rot_ab
  FROM pflanzen_bestand b
  JOIN pflanzen_katalog k ON b.art_id = k.id
  WHERE b.id = p_pflanze_id;

  IF v_tage_seit >= (v_rot_ab + v_korrektur) THEN RETURN 'rot';
  ELSIF v_tage_seit >= (v_gelb_ab + v_korrektur) THEN RETURN 'gelb';
  ELSE RETURN 'gruen';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- View erweitert um Ampel-Status und Tage seit letzter Gießung
CREATE OR REPLACE VIEW v_pflanzen_ampel AS
SELECT
  b.id,
  b.name,
  b.gruppe_id,
  g.name AS gruppe_name,
  (SELECT MAX(datum) FROM giessungen WHERE pflanze_id = b.id) AS letzte_giessung,
  (CURRENT_DATE - (SELECT MAX(datum) FROM giessungen WHERE pflanze_id = b.id)) AS tage_seit_giessung,
  berechne_ampel_status(b.id) AS ampel_status
FROM pflanzen_bestand b
LEFT JOIN standort_gruppen g ON b.gruppe_id = g.id;


-- ============================================================
-- ERWEITERUNG V1.2: Spitznamen, freie Zimmer/Gruppen-Anlage
-- ============================================================

ALTER TABLE pflanzen_bestand
  ADD COLUMN spitzname TEXT;

-- Zimmer sollen frei erweiterbar sein -> eigene Tabelle statt nur Freitext,
-- damit die Konfigurationsseite bestehende Zimmer vorschlagen UND neue anlegen kann
CREATE TABLE zimmer (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL UNIQUE,
  etage       TEXT,
  neu_angelegt_am TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO zimmer (name, etage) VALUES ('Esszimmer', 'Erdgeschoss');

ALTER TABLE zimmer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_zimmer" ON zimmer FOR ALL USING (true);

-- v_pflanzen_komplett neu erstellen, jetzt inkl. spitzname/korrektur_tage/gruppe_id
-- (die Spalten kamen erst durch die Erweiterungen oben dazu)
CREATE OR REPLACE VIEW v_pflanzen_komplett AS
SELECT
  b.id,
  b.name,
  b.spitzname,
  b.art_id,
  k.pflanzenname_de,
  k.gattung,
  k.art_lateinisch,
  k.wasserbedarf_stufe,
  k.giessintervall_sommer_tage,
  k.giessintervall_winter_tage,
  k.giessregel,
  k.licht,
  k.giftig,
  k.giftig_fuer,
  k.pflege_duengen,
  k.pflege_umtopfen,
  k.pflege_luftfeuchtigkeit,
  k.pflege_temperatur,
  k.pflege_typische_probleme,
  b.standort_zimmer,
  b.standort_etage,
  b.standort_position,
  b.topf_innendurchmesser_mm,
  b.topf_zustand,
  b.topf_umtopfen_empfohlen,
  b.topf_notiz,
  b.uebertopf_geplant_mm,
  b.bewaesserungssystem,
  b.zustand_bewertung,
  b.zustand_bemerkungen,
  b.zustand_letzte_kontrolle,
  b.foto_url,
  b.naechste_giessung,
  b.korrektur_tage,
  b.gruppe_id,
  b.aktualisiert_am
FROM pflanzen_bestand b
LEFT JOIN pflanzen_katalog k ON b.art_id = k.id;
