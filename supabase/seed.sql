-- ============================================================
-- Seed-Daten aus zimmerpflanzen_db.json
-- ============================================================

-- Pflanzen Katalog
INSERT INTO pflanzen_katalog (
  id, pflanzenname_de, gattung, art_lateinisch, herkunft,
  wasserbedarf_stufe, giessintervall_sommer_tage, giessintervall_winter_tage,
  giessregel, licht, bewaesserungssystem_kompatibel,
  pflege_duengen, pflege_umtopfen, pflege_luftfeuchtigkeit, pflege_temperatur,
  pflege_typische_probleme, giftig, giftig_fuer, notizen
) VALUES
(
  'art001', 'Fensterblatt', 'Monstera', 'Monstera deliciosa', 'Tropisches Mittelamerika',
  'mittel', 14, 21,
  'Erst gießen wenn die oberen 2–3 cm des Substrats trocken sind. Zimmerwarmes Wasser bevorzugen, kein Kalk. Staunässe unbedingt vermeiden.',
  'hell bis halbschattig, kein direktes Sonnenlicht', true,
  'April–September alle 4 Wochen mit Flüssigdünger',
  'Alle 2 Jahre im Frühjahr, wenn Wurzeln aus dem Topf wachsen',
  'Hoch – regelmäßig besprühen oder Schale mit Wasser aufstellen',
  '18–27°C, kein Zug, nicht unter 12°C',
  ARRAY['Gelbe Blätter = zu viel Wasser', 'Braune Blattspitzen = zu trockene Luft', 'Keine Fensterung = zu wenig Licht'],
  true, 'Hunde, Katzen, Menschen (mild)',
  'Luftwurzeln zusätzlich mit Wasser besprühen alle 2–3 Tage empfohlen'
),
(
  'art002', 'Drachenbaum', 'Dracaena', 'Dracaena marginata / Dracaena fragrans', 'Afrika, tropisches Asien',
  'niedrig', 14, 35,
  'Sehr sparsam gießen. Erst wenn die Erde komplett trocken ist. Staunässe führt sofort zu Wurzelfäule und Blattabwurf. Fingerprobe vor jedem Gießen.',
  'hell bis halbschattig, max. 3h direkte Sonne täglich', true,
  'April–September alle 4–6 Wochen, sehr sparsam',
  'Alle 2–3 Jahre, nur wenn Wurzeln kreisen',
  'Mittel – gelegentlich besprühen',
  '15–25°C, kein Zug, nicht unter 10°C',
  ARRAY['Gelbe Blätter = zu viel Wasser (häufigster Fehler)', 'Braune Spitzen = zu trockene Luft oder Fluorid im Wasser', 'Blattabwurf = Staunässe oder Kälte'],
  true, 'Hunde, Katzen',
  'Genügsamste Pflanze im Bestand – lieber zu wenig als zu viel'
),
(
  'art003', 'Birkenfeige / Benjamini', 'Ficus', 'Ficus benjamina', 'Südostasien, Australien',
  'mittel', 7, 10,
  'Wurzelballen leicht feucht halten, nie komplett austrocknen lassen. Empfindlich gegenüber Staunässe UND Trockenheit – beides löst Blattabwurf aus. Kalkarmes Wasser verwenden.',
  'hell, kein direktes Mittagssonnenlicht', true,
  'März–September alle 3–4 Wochen',
  'Alle 2 Jahre im Frühjahr',
  'Mittel',
  '16–24°C, kein Zug, nicht unter 10°C',
  ARRAY['Blattabwurf = Standortwechsel, Zug oder falsche Bewässerung', 'Gelbe Blätter = zu viel Wasser', 'Klebrige Blätter = Schild- oder Wollläuse'],
  false, NULL,
  'Sehr standorttreu – Ortsveränderungen vermeiden, wirft sonst Blätter ab'
),
(
  'art004', 'Efeutute / Pothos', 'Epipremnum', 'Epipremnum aureum', 'Südostasien, Pazifik',
  'mittel', 7, 14,
  'Erde leicht antrocknen lassen zwischen den Güssen. Sehr robust, verzeiht gelegentliches Vergessen. Keine Staunässe.',
  'hell bis halbschattig, auch schattentolerant', true,
  'März–Oktober alle 4 Wochen',
  'Alle 1–2 Jahre wenn Wurzeln aus Löchern wachsen',
  'Niedrig bis mittel – sehr anpassungsfähig',
  '15–30°C, robust, kein Frost',
  ARRAY['Gelbe Blätter = zu viel Wasser', 'Blasse Blätter = zu wenig Licht', 'Variegierung verblasst = zu dunkel'],
  true, 'Hunde, Katzen (mild)',
  'Sehr pflegeleicht, ideal für Hängeampel. Rankend oder hängend verwendbar.'
),
(
  'art005', 'Wolfsmilch / Euphorbie', 'Euphorbia', 'Euphorbia sp.', 'Afrika, Madagaskar',
  'niedrig', 21, 42,
  'Sehr sparsam gießen, sukkulentenartig. Erde muss zwischen den Güssen vollständig austrocknen. Im Winter kaum gießen.',
  'sonnig bis hell, verträgt direkte Sonne', false,
  'Mai–August alle 6–8 Wochen, Kaktus-/Succulent-Dünger',
  'Alle 3–4 Jahre, nur bei Bedarf',
  'Niedrig – verträgt trockene Luft gut',
  '18–30°C Sommer, 10–15°C Winter (Ruhephase)',
  ARRAY['Weiche Stängel = Staunässe/Wurzelfäule', 'Schrumpfende Blätter = zu wenig Wasser (selten)', 'Kein Wuchs = zu dunkel oder zu kalt'],
  true, 'Menschen, Hunde, Katzen – Milchsaft reizt Haut und Schleimhäute stark',
  NULL
),
(
  'art006', 'Christusdorn', 'Euphorbia', 'Euphorbia milii', 'Madagaskar',
  'niedrig', 14, 30,
  'Mäßig gießen, Erde zwischen Güssen antrocknen lassen. Staunässe unbedingt vermeiden. Im Winter sehr wenig.',
  'sonnig, Fensterbank mit viel Licht ideal', false,
  'März–Oktober alle 4 Wochen, Kaktusdünger',
  'Alle 2–3 Jahre im Frühjahr',
  'Niedrig – mag trockene Zimmerluft',
  '18–30°C, im Winter mind. 12°C',
  ARRAY['Blätter fallen ab = zu kalt oder zu dunkel', 'Keine Blüte = zu wenig Licht', 'Faulende Basis = Staunässe'],
  true, 'Menschen, Hunde, Katzen – Milchsaft giftig',
  'Blüht bei ausreichend Licht fast ganzjährig.'
);

-- Pflanzen Bestand
INSERT INTO pflanzen_bestand (
  id, name, art_id,
  standort_zimmer, standort_etage, standort_position,
  topf_innendurchmesser_mm, topf_zustand, topf_umtopfen_empfohlen, topf_notiz,
  uebertopf_geplant_mm, bewaesserungssystem,
  zustand_bewertung, zustand_bemerkungen, zustand_letzte_kontrolle
) VALUES
('p001', 'Ficus Benjamini', 'art003', 'Esszimmer', 'Erdgeschoss', 'Boden, Wandbereich', NULL, 'groß, etabliert', false, 'Topfgröße noch nachmessen – große Pflanze ca. 150–180cm hoch', NULL, 'Dochtsystem geplant', 'gut', 'Große etablierte Pflanze, viele Blätter, einige kahle Äste', '2026-09-06'),
('p002', 'Efeutute Fensterbank', 'art004', 'Esszimmer', 'Erdgeschoss', 'Fensterbank', NULL, 'türkiser Keramiktopf', false, 'Topfgröße noch nachmessen – kleiner Topf ca. 12–15cm', NULL, 'Dochtsystem geplant', 'gut', 'Hellgrüne kräftige Blätter, guter Wuchs', '2026-09-06'),
('p003', 'Euphorbie (Wolfsmilch)', 'art005', 'Esszimmer', 'Erdgeschoss', 'Fensterbank', NULL, 'grauer Kunststofftopf', false, 'Topfgröße noch nachmessen', NULL, 'kein Dochtsystem – zu trockenhaltend', 'gut', 'Treibt neu aus, kompakter Wuchs', '2026-09-06'),
('p004', 'Christusdorn', 'art006', 'Esszimmer', 'Erdgeschoss', 'Fensterbank', NULL, 'dunkler Keramiktopf mit Untersetzer', false, 'Topfgröße noch nachmessen', NULL, 'kein Dochtsystem – zu trockenhaltend', 'gut', 'Blüht aktiv rosa/rot, gesundes Laub', '2026-09-06'),
('p005', 'Monstera klein', 'art001', 'Esszimmer', 'Erdgeschoss', 'Boden auf Holzpalette, Fensterbereich', 200, 'grauer Übertopf mit schwarzem Innentopf', false, 'Pflanze mit Stab gestützt', 250, 'Dochtsystem geplant', 'kritisch', 'Ein Blatt stark braun und vertrocknet, Pflanze sehr karg, nur 1-2 Blätter, Wurzeln oder Bewässerung prüfen', '2026-09-06'),
('p006', 'Monstera groß', 'art001', 'Esszimmer', 'Erdgeschoss', 'Boden, Fensterbereich / Terrassentür', 250, 'gut', false, 'Sehr große prächtige Pflanze mit reifen gefensterten Blättern', 310, 'Dochtsystem geplant', 'sehr gut', 'Üppig, viele große gefensterte Blätter, prächtig', '2026-09-06'),
('p007', 'Efeutute Hängeampel 1 (marmoriert)', 'art004', 'Esszimmer', 'Erdgeschoss', 'Hängeampel (Makramee), Decke', NULL, 'Hängetopf in Makramee-Ampel', false, 'Topfgröße noch nachmessen – marmorierte Sorte gelblich-grün', NULL, 'manuell gießen – kein Dochtsystem bei Hängeampel', 'gut', 'Lange herabhängende Triebe, marmorierte Blätter gelblich-grün', '2026-09-06'),
('p008', 'Efeutute Hängeampel 2 (grün)', 'art004', 'Esszimmer', 'Erdgeschoss', 'Hängeampel (Makramee), Decke', NULL, 'Hängetopf in Makramee-Ampel', false, 'Topfgröße noch nachmessen – dunkelgrüne Sorte', NULL, 'manuell gießen – kein Dochtsystem bei Hängeampel', 'gut', 'Dichte dunkelgrüne Blätter, gesund wirkend', '2026-09-06'),
('p009', 'Monstera 1 (alt)', 'art001', NULL, NULL, NULL, 200, 'alt', true, 'Aus ursprünglicher Bestandsaufnahme', 250, 'Dochtsystem geplant', NULL, 'Noch nicht fotografiert / kontrolliert', NULL),
('p010', 'Drachenblatt', 'art002', NULL, NULL, NULL, 180, NULL, false, 'Aus ursprünglicher Bestandsaufnahme', 230, 'Dochtsystem geplant', NULL, 'Noch nicht fotografiert / kontrolliert', NULL),
('p011', 'Monstera 3', 'art001', NULL, NULL, NULL, 200, NULL, false, 'Aus ursprünglicher Bestandsaufnahme', 250, 'Dochtsystem geplant', NULL, 'Noch nicht fotografiert / kontrolliert', NULL);


-- ============================================================
-- SEED ERWEITERUNG V1.1
-- ============================================================

-- Ampel-Schwellenwerte je Art
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 10, rot_ab_tage_sommer = 16, gelb_ab_tage_winter = 16, rot_ab_tage_winter = 24 WHERE id = 'art001';
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 12, rot_ab_tage_sommer = 18, gelb_ab_tage_winter = 28, rot_ab_tage_winter = 40 WHERE id = 'art002';
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 5,  rot_ab_tage_sommer = 8,  gelb_ab_tage_winter = 7,  rot_ab_tage_winter = 12 WHERE id = 'art003';
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 5,  rot_ab_tage_sommer = 9,  gelb_ab_tage_winter = 10, rot_ab_tage_winter = 16 WHERE id = 'art004';
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 15, rot_ab_tage_sommer = 25, gelb_ab_tage_winter = 30, rot_ab_tage_winter = 48 WHERE id = 'art005';
UPDATE pflanzen_katalog SET gelb_ab_tage_sommer = 10, rot_ab_tage_sommer = 16, gelb_ab_tage_winter = 22, rot_ab_tage_winter = 34 WHERE id = 'art006';

-- Standort-Gruppen
INSERT INTO standort_gruppen (id, name, typ, etage, platzhalter, sortierung) VALUES
('grp_eg', 'Erdgeschoss', 'innen', 'Erdgeschoss', false, 1),
('grp_og1', '1. Obergeschoss', 'innen', 'Obergeschoss', false, 2),
('grp_aussen_eg', 'Draußen - Erdgeschoss/Terrasse', 'aussen', 'Erdgeschoss', true, 3),
('grp_aussen_og1', 'Draußen - Balkon 1. OG', 'aussen', 'Obergeschoss', true, 4);

-- Bestehende Pflanzen der Gruppe Erdgeschoss zuordnen (alle aktuellen Pflanzen sind im Esszimmer EG)
UPDATE pflanzen_bestand SET gruppe_id = 'grp_eg' WHERE standort_etage = 'Erdgeschoss';


-- ============================================================
-- SEED ERWEITERUNG V1.2: Spitznamen
-- ============================================================

UPDATE pflanzen_bestand SET spitzname = 'Felix' WHERE id = 'p001';
UPDATE pflanzen_bestand SET spitzname = 'Emma'  WHERE id = 'p002';
UPDATE pflanzen_bestand SET spitzname = 'Luna'  WHERE id = 'p003';
UPDATE pflanzen_bestand SET spitzname = 'Rosa'  WHERE id = 'p004';
UPDATE pflanzen_bestand SET spitzname = 'Mimi'  WHERE id = 'p005';
UPDATE pflanzen_bestand SET spitzname = 'Greta' WHERE id = 'p006';
UPDATE pflanzen_bestand SET spitzname = 'Nala'  WHERE id = 'p007';
UPDATE pflanzen_bestand SET spitzname = 'Frida' WHERE id = 'p008';
UPDATE pflanzen_bestand SET spitzname = 'Paula' WHERE id = 'p009';
UPDATE pflanzen_bestand SET spitzname = 'Elsa'  WHERE id = 'p010';
UPDATE pflanzen_bestand SET spitzname = 'Nora'  WHERE id = 'p011';
