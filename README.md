# 🌿 Pflanzen App

Expo + Supabase App zum Tracken deiner Zimmerpflanzen.

---

## Setup in 5 Schritten

### 1. Supabase Projekt anlegen
1. Gehe zu [supabase.com](https://supabase.com) → New Project
2. Name: `pflanzen-app`, Region: Frankfurt (eu-central-1)
3. Warte bis Projekt bereit ist

### 2. Datenbank einrichten
Im Supabase Dashboard → **SQL Editor**:
1. Inhalt von `supabase/schema.sql` einfügen → Run
2. Inhalt von `supabase/seed.sql` einfügen → Run

### 3. Storage Bucket anlegen
Supabase Dashboard → **Storage** → New Bucket:
- Name: `fotos`
- Public: ✅ (Ja)

### 4. Environment Variables
```bash
cp .env.example .env
```
Dann in `.env` eintragen:
- `EXPO_PUBLIC_SUPABASE_URL` → Settings → API → Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Settings → API → anon public key

### 5. App starten
```bash
npm install
npx expo start
```
Dann QR-Code mit der **Expo Go** App scannen (iOS/Android).

---

## Projektstruktur

```
pflanzen-app/
├── app/
│   ├── _layout.tsx          # Navigation Root
│   ├── index.tsx            # Pflanzenliste (Home)
│   └── pflanze/[id].tsx     # Pflanze Detail
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase Client
│   │   ├── hooks.ts         # Data Hooks + API Calls
│   │   └── constants.ts     # Farben, Emojis, Labels
│   └── types/index.ts       # TypeScript Types
├── supabase/
│   ├── schema.sql           # DB Tabellen + Views + Policies
│   └── seed.sql             # Initialdaten aus JSON-DB
└── .env.example             # Env-Template
```

## Features V1
- [x] Pflanzenliste nach Raum gruppiert
- [x] Zustand-Farbanzeige (sehr gut → kritisch)
- [x] Pflanze Detail mit Pflegehinweisen
- [x] Gießung per Knopfdruck eintragen
- [x] Gieß-Historie
- [x] Zustand updaten mit Bemerkung
- [x] Foto aufnehmen + in Supabase Storage speichern

## Nächste Schritte (V2)
- [ ] Push-Benachrichtigungen (expo-notifications)
- [ ] Gieß-Kalender View
- [ ] Pflanze hinzufügen / bearbeiten
- [ ] Filter nach Etage/Wasserbedarf
- [ ] Dunkel-Modus


## Alternative: Selbst-Hosting im Heimnetzwerk (statt Supabase Cloud)

Diese Variante lässt die komplette Datenbank lokal auf deinem eigenen Server laufen
(z.B. dem Rechner, auf dem auch Home Assistant läuft), statt bei Supabase Cloud.
Wichtig: Die App funktioniert dann NUR, wenn dein Handy im selben Heimnetzwerk ist
wie der Server. Von unterwegs geht das ohne zusätzliches VPN nicht.

### 1. Supabase per Docker Compose auf dem Server installieren

Auf dem Server (z.B. via SSH):

```
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

In der `.env` Datei die Passwörter und JWT-Secrets auf eigene, sichere Werte setzen
(niemals die Beispielwerte aus dem Repo produktiv verwenden).

Dann starten mit:

```
docker compose up -d
```

Das startet alle nötigen Container: Datenbank, Authentifizierung, Speicher (Storage),
API-Gateway und das Studio-Interface zur Verwaltung.

### 2. Schema und Seed-Daten einspielen

Sobald die Container laufen, ist das Studio erreichbar unter:

`http://<server-ip>:8000`

Dort im SQL-Editor genau wie bei der Cloud-Variante zuerst `schema.sql`,
dann `seed.sql` ausführen. Anschließend im Bereich Storage einen neuen
öffentlichen Bucket namens `fotos` anlegen.

### 3. App auf den lokalen Server zeigen lassen

In der `.env` Datei der App (nicht die von Supabase, sondern die im
`pflanzen-app` Ordner) folgendes eintragen, statt der Cloud-Adresse:

```
EXPO_PUBLIC_SUPABASE_URL=http://<server-ip>:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key aus deiner .env von Schritt 1>
```

Die Server-IP findest du z.B. direkt in Home Assistant unter den
Netzwerk-Einstellungen, oder indem du auf dem Server selbst `hostname -I`
in einem Terminal ausführst.

### Wichtig zu wissen

- Das Handy muss sich im selben WLAN wie der Server befinden, sonst wird
  die Adresse nicht erreichbar sein.
- Falls sich die lokale IP-Adresse des Servers mal ändert (z.B. nach einem
  Router-Neustart), muss die `.env` der App entsprechend angepasst werden.
  Am besten dem Server im Router eine feste IP-Adresse zuweisen, um das zu vermeiden.
- Diese Variante ersetzt Supabase Cloud komplett, es entstehen keine
  laufenden Kosten und keine Daten verlassen dein Heimnetzwerk.
