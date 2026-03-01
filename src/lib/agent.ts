import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './db'
import { slugify } from './utils'
import type { VerstossArt } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const VERSTOSS_LABELS: Record<VerstossArt, string> = {
  GESCHWINDIGKEIT: 'Geschwindigkeitsverstoß',
  ABSTAND: 'Abstandsverstoß',
  ROTLICHT: 'Rotlichtverstoß',
}

export async function runResearchAgent(messstelleId: string) {
  const messstelle = await prisma.messstelle.findUnique({
    where: { id: messstelleId },
  })

  if (!messstelle) throw new Error('Messstelle nicht gefunden')

  await prisma.messstelle.update({
    where: { id: messstelleId },
    data: { researchStatus: 'RESEARCHING' },
  })

  try {
    const verstossLabel = VERSTOSS_LABELS[messstelle.verstossArt as VerstossArt]

    // Use Claude with tools for structured research
    const systemPrompt = `Du bist ein Experte für Verkehrsrecht und Blitzeranlagen in Deutschland.
Du recherchierst detaillierte, korrekte und rechtlich fundierte Informationen zu Blitzer-Messstellen.
Antworte immer auf Deutsch und liefere präzise, faktische Informationen.
Strukturiere deine Antworten klar und verständlich für normale Autofahrer.`

    const userPrompt = `Recherchiere folgende Informationen zur Blitzer-Messstelle:

Titel: ${messstelle.titel}
Verstoßart: ${verstossLabel}
Bundesland: ${messstelle.bundesland}
Ort: ${messstelle.ort}
${messstelle.autobahn ? `Autobahn: ${messstelle.autobahn}` : ''}
${messstelle.abschnitt ? `Abschnitt: ${messstelle.abschnitt}` : ''}
${messstelle.kilometer ? `Kilometer: ${messstelle.kilometer}` : ''}

Erstelle bitte ALLE folgenden Informationen als valides JSON-Objekt mit exakt dieser Struktur:

{
  "bundesland": "Erkanntes Bundesland (Vollname)",
  "ort": "Hauptort der Messstelle",
  "autobahn": "Autobahnbezeichnung z.B. A9 oder null",
  "beschreibung": "Allgemeine Beschreibung der Messstelle (200-400 Zeichen). Was ist das für eine Messstelle, wo liegt sie, was wird gemessen.",
  "standortBeschreibung": "Detaillierte Beschreibung des genauen Standorts (300-500 Zeichen). Kilometer, Fahrtrichtung, Streckenverlauf, Besonderheiten der Strecke.",
  "geraeteBeschreibung": "Analyse des eingesetzten Messgeräts (300-500 Zeichen). Welches Gerät wird typischerweise eingesetzt, wie funktioniert es, z.B. PoliScan Speed, TraffiStar S350, VITRONIC, Jenoptik usw.",
  "behoerde": {
    "name": "Vollständiger Name der zuständigen Bußgeldbehörde",
    "bundesland": "Bundesland der Behörde",
    "adresse": "Straße und Hausnummer",
    "plz": "Postleitzahl",
    "stadt": "Stadt",
    "telefon": "Telefonnummer falls bekannt oder null",
    "email": "E-Mail falls bekannt oder null",
    "website": "Website-URL falls bekannt oder null",
    "beschreibung": "Beschreibung der Behörde und ihrer Zuständigkeit (200-400 Zeichen)"
  },
  "einspruchBeschreibung": "Detaillierte Beschreibung der Einspruchsmöglichkeiten (400-600 Zeichen). Fristen, Verfahren, rechtliche Möglichkeiten, Tipps. Für den Verstoß: ${verstossLabel}",
  "faq": [
    {
      "frage": "Wo befindet sich der Blitzer ${messstelle.titel}?",
      "antwort": "Konkrete Antwort mit Standortangaben"
    },
    {
      "frage": "Welches Messgerät wird an der Messstelle ${messstelle.titel} eingesetzt?",
      "antwort": "Konkrete Antwort zum Messgerät"
    },
    {
      "frage": "Wie hoch ist das Bußgeld bei einem ${verstossLabel} an der Messstelle ${messstelle.titel}?",
      "antwort": "Konkrete Antwort mit Bußgeldbeträgen"
    },
    {
      "frage": "Wer ist die zuständige Bußgeldbehörde für die Messstelle ${messstelle.titel}?",
      "antwort": "Konkrete Antwort zur Behörde"
    },
    {
      "frage": "Wie lange habe ich Zeit, Einspruch gegen einen Bußgeldbescheid von der Messstelle ${messstelle.titel} einzulegen?",
      "antwort": "2 Wochen nach Zustellung des Bußgeldbescheids"
    },
    {
      "frage": "Was passiert, wenn ich den Bußgeldbescheid ignoriere?",
      "antwort": "Konkrete rechtliche Konsequenzen"
    }
  ],
  "bussgeldTabelle": ${getBussgeldTableTemplate(messstelle.verstossArt as VerstossArt)}
}

Wichtig: Antworte NUR mit dem JSON-Objekt, ohne zusätzliche Erklärungen oder Markdown-Formatierung.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Ungültige Antwort vom AI-Agent')

    // Extract JSON from response
    const jsonText = content.text.trim()
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Kein JSON in der Antwort gefunden')

    const data = JSON.parse(jsonMatch[0])

    // Upsert Behoerde
    let behoerdeId: string | null = null
    if (data.behoerde && data.behoerde.name) {
      const behoerdeSlug = slugify(data.behoerde.name)
      const behoerde = await prisma.behoerde.upsert({
        where: { slug: behoerdeSlug },
        update: {
          beschreibung: data.behoerde.beschreibung,
          telefon: data.behoerde.telefon || null,
          email: data.behoerde.email || null,
          website: data.behoerde.website || null,
        },
        create: {
          name: data.behoerde.name,
          bundesland: data.behoerde.bundesland || messstelle.bundesland,
          adresse: data.behoerde.adresse || null,
          plz: data.behoerde.plz || null,
          stadt: data.behoerde.stadt || null,
          telefon: data.behoerde.telefon || null,
          email: data.behoerde.email || null,
          website: data.behoerde.website || null,
          beschreibung: data.behoerde.beschreibung || null,
          slug: behoerdeSlug,
        },
      })
      behoerdeId = behoerde.id
    }

    // Update Messstelle with research results
    await prisma.messstelle.update({
      where: { id: messstelleId },
      data: {
        bundesland: data.bundesland || messstelle.bundesland,
        ort: data.ort || messstelle.ort,
        autobahn: data.autobahn || messstelle.autobahn,
        beschreibung: data.beschreibung,
        standortBeschreibung: data.standortBeschreibung,
        geraeteBeschreibung: data.geraeteBeschreibung,
        einspruchBeschreibung: data.einspruchBeschreibung,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        faq: data.faq as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bussgeldTabelle: data.bussgeldTabelle as any,
        behoerdeId,
        researchStatus: 'COMPLETED',
        istVeroeffentlicht: true,
      },
    })

    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unbekannter Fehler'
    await prisma.messstelle.update({
      where: { id: messstelleId },
      data: {
        researchStatus: 'FAILED',
        researchError: errorMsg,
      },
    })
    throw error
  }
}

function getBussgeldTableTemplate(verstossArt: VerstossArt): string {
  if (verstossArt === 'GESCHWINDIGKEIT') {
    return JSON.stringify([
      {
        kategorie: "Bis 10 km/h zu schnell",
        innerorts: "20 €",
        ausserorts: "20 €",
        punkte: "0",
        fahrverbot: "–"
      },
      {
        kategorie: "11–15 km/h zu schnell",
        innerorts: "40 €",
        ausserorts: "40 €",
        punkte: "0",
        fahrverbot: "–"
      },
      {
        kategorie: "16–20 km/h zu schnell",
        innerorts: "60 €",
        ausserorts: "60 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "21–25 km/h zu schnell",
        innerorts: "115 €",
        ausserorts: "100 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "26–30 km/h zu schnell",
        innerorts: "180 €",
        ausserorts: "150 €",
        punkte: "1",
        fahrverbot: "1 Monat (bei Wdh.)"
      },
      {
        kategorie: "31–40 km/h zu schnell",
        innerorts: "260 €",
        ausserorts: "200 €",
        punkte: "2",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "41–50 km/h zu schnell",
        innerorts: "400 €",
        ausserorts: "320 €",
        punkte: "2",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "51–60 km/h zu schnell",
        innerorts: "560 €",
        ausserorts: "480 €",
        punkte: "2",
        fahrverbot: "2 Monate"
      },
      {
        kategorie: "61–70 km/h zu schnell",
        innerorts: "700 €",
        ausserorts: "600 €",
        punkte: "2",
        fahrverbot: "3 Monate"
      },
      {
        kategorie: "Über 70 km/h zu schnell",
        innerorts: "ab 800 €",
        ausserorts: "ab 700 €",
        punkte: "2",
        fahrverbot: "3 Monate"
      }
    ])
  } else if (verstossArt === 'ABSTAND') {
    return JSON.stringify([
      {
        kategorie: "Abstand < 5/10 bei 80–100 km/h",
        innerorts: "75 €",
        ausserorts: "75 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "Abstand < 4/10 bei 80–100 km/h",
        innerorts: "100 €",
        ausserorts: "100 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "Abstand < 3/10 bei 80–100 km/h",
        innerorts: "160 €",
        ausserorts: "160 €",
        punkte: "1",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Abstand < 2/10 bei 80–100 km/h",
        innerorts: "240 €",
        ausserorts: "240 €",
        punkte: "1",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Abstand < 1/10 bei 80–100 km/h",
        innerorts: "320 €",
        ausserorts: "320 €",
        punkte: "2",
        fahrverbot: "2 Monate"
      },
      {
        kategorie: "Abstand < 5/10 bei über 100 km/h",
        innerorts: "100 €",
        ausserorts: "100 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "Abstand < 4/10 bei über 100 km/h",
        innerorts: "180 €",
        ausserorts: "180 €",
        punkte: "1",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Abstand < 3/10 bei über 100 km/h",
        innerorts: "240 €",
        ausserorts: "240 €",
        punkte: "1",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Abstand < 2/10 bei über 100 km/h",
        innerorts: "320 €",
        ausserorts: "320 €",
        punkte: "2",
        fahrverbot: "2 Monate"
      },
      {
        kategorie: "Abstand < 1/10 bei über 100 km/h",
        innerorts: "400 €",
        ausserorts: "400 €",
        punkte: "2",
        fahrverbot: "3 Monate"
      }
    ])
  } else {
    return JSON.stringify([
      {
        kategorie: "Rotlicht bis 1 Sekunde",
        innerorts: "90 €",
        ausserorts: "90 €",
        punkte: "1",
        fahrverbot: "–"
      },
      {
        kategorie: "Rotlicht über 1 Sekunde (qualifizierter Rotlichtverstoß)",
        innerorts: "200 €",
        ausserorts: "200 €",
        punkte: "2",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Rotlicht bis 1 Sek. + Gefährdung/Sachschaden",
        innerorts: "240 €",
        ausserorts: "240 €",
        punkte: "2",
        fahrverbot: "1 Monat"
      },
      {
        kategorie: "Rotlicht über 1 Sek. + Gefährdung/Sachschaden",
        innerorts: "320 €",
        ausserorts: "320 €",
        punkte: "2",
        fahrverbot: "1 Monat"
      }
    ])
  }
}
