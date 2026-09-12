// Supabase Edge Function: lookup-pflanzenart
//
// Recherchiert per Claude (Web-Suche) Pflegedaten zu einer neuen Pflanzenart
// und liefert sie strukturiert zurück, passend zu den Spalten von
// public.pflanzen_katalog. Schreibt NICHT selbst in die Datenbank -
// die App zeigt das Ergebnis zur Kontrolle an, bevor addArt() es speichert.
//
// Aufruf (aus der App): supabase.functions.invoke('lookup-pflanzenart', {
//   body: { name: 'Korbmarante', gattung: 'Calathea' }
// })

import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist ein Assistent für eine deutschsprachige Zimmerpflanzen-App. Du recherchierst mit der Websuche zuverlässige Pflegeinformationen zu einer Zimmer-/Balkonpflanze und übergibst sie AUSSCHLIESSLICH strukturiert über das Tool "submit_pflanzenart_daten".

Regeln:
- Alle Texte auf Deutsch, knapp und sachlich wie in einem Pflanzenlexikon.
- Nutze wenn möglich mindestens zwei Quellen, bevorzugt seriöse Gartenbau-/Botanik-Websites.
- Bist du dir bei einem Feld unsicher, setze es auf null statt zu raten, und erwähne die Unsicherheit im Feld "notizen".
- giessintervall_sommer_tage / giessintervall_winter_tage: Anzahl Tage ZWISCHEN zwei Wassergaben (kein Datum, keine Menge).
- temperatur_min_c / temperatur_max_c: falls eine Quelle nur eine Idealtemperatur ohne Bereich nennt, leite einen plausiblen Toleranzbereich ab.
- giftig / giftig_fuer: beziehe dich auf Menschen UND Haustiere (Hunde/Katzen), falls bekannt.
- Rufe "submit_pflanzenart_daten" GENAU EINMAL auf, erst nachdem du ausreichend recherchiert hast. Rufe danach kein weiteres Tool mehr auf.`;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_pflanzenart_daten",
  description:
    "Übergibt die recherchierten, strukturierten Pflegedaten für die Pflanzenart als finale Antwort.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      pflanzenname_de: { type: "string", description: "Deutscher Trivialname" },
      gattung: { type: "string", description: "Botanische Gattung" },
      art_lateinisch: { type: ["string", "null"], description: "Vollständiger botanischer Name/Sorte, falls bekannt" },
      herkunft: { type: ["string", "null"] },
      wasserbedarf_stufe: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
      giessintervall_sommer_tage: { type: ["integer", "null"] },
      giessintervall_winter_tage: { type: ["integer", "null"] },
      giessregel: { type: ["string", "null"] },
      licht: { type: ["string", "null"] },
      pflege_duengen: { type: ["string", "null"] },
      pflege_umtopfen: { type: ["string", "null"] },
      pflege_luftfeuchtigkeit: { type: ["string", "null"] },
      pflege_temperatur: { type: ["string", "null"], description: "Freitext-Zusammenfassung, z.B. '18-24°C, nicht unter 12°C'" },
      pflege_typische_probleme: { type: "array", items: { type: "string" } },
      giftig: { type: "boolean" },
      giftig_fuer: { type: ["string", "null"] },
      temperatur_min_c: { type: ["integer", "null"] },
      temperatur_max_c: { type: ["integer", "null"] },
      essbar: { type: "boolean" },
      giesshaeufigkeit_pro_woche: { type: ["number", "null"] },
      notizen: { type: ["string", "null"], description: "Unsicherheiten, Besonderheiten" },
      quellen: { type: "array", items: { type: "string" }, description: "URLs der verwendeten Quellen" },
    },
    required: [
      "pflanzenname_de", "gattung", "art_lateinisch", "herkunft", "wasserbedarf_stufe",
      "giessintervall_sommer_tage", "giessintervall_winter_tage", "giessregel", "licht",
      "pflege_duengen", "pflege_umtopfen", "pflege_luftfeuchtigkeit", "pflege_temperatur",
      "pflege_typische_probleme", "giftig", "giftig_fuer", "temperatur_min_c", "temperatur_max_c",
      "essbar", "giesshaeufigkeit_pro_woche", "notizen", "quellen",
    ],
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: { name?: string; gattung?: string; art_lateinisch?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Ungültiger JSON-Body." }, 400);
  }

  const { name, gattung, art_lateinisch } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return jsonResponse({ error: "Feld 'name' fehlt oder ist leer." }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY ist auf dem Server nicht konfiguriert." }, 500);
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = [
    "Recherchiere Pflegeinformationen für folgende Pflanze:",
    `Name: ${name.trim()}`,
    gattung ? `Gattung: ${gattung.trim()}` : null,
    art_lateinisch ? `Botanischer Name: ${art_lateinisch.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  let submitInput: Record<string, unknown> | null = null;

  try {
    for (let i = 0; i < 8 && !submitInput; i++) {
      const response = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        output_config: { effort: "medium" },
        system: SYSTEM_PROMPT,
        tool_choice: { type: "any" },
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 6 },
          SUBMIT_TOOL,
        ],
        messages,
      });

      if (response.stop_reason === "refusal") {
        return jsonResponse({ error: "Anfrage von Claude abgelehnt." }, 422);
      }

      const submitBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "submit_pflanzenart_daten",
      );
      if (submitBlock) {
        submitInput = submitBlock.input as Record<string, unknown>;
        break;
      }

      if (response.stop_reason === "pause_turn") {
        // Server-seitige Websuche noch nicht fertig - Turn fortsetzen.
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const hasToolUse = response.content.some((b) => b.type === "tool_use");
      if (!hasToolUse) {
        // tool_choice erzwingt eigentlich immer einen Tool-Call - Sicherheitsnetz.
        break;
      }

      messages.push({ role: "assistant", content: response.content });
      // web_search ist ein Server-Tool - das Ergebnis steckt bereits in response.content,
      // es muss kein tool_result zurückgeschickt werden. Einfach die Schleife fortsetzen.
    }
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler bei der Anthropic-Anfrage.";
    return jsonResponse({ error: message }, 502);
  }

  if (!submitInput) {
    return jsonResponse({ error: "Keine strukturierten Daten erhalten - bitte erneut versuchen." }, 502);
  }

  return jsonResponse({ data: submitInput });
});
