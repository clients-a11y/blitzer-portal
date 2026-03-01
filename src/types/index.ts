export type VerstossArt = 'GESCHWINDIGKEIT' | 'ABSTAND' | 'ROTLICHT'
export type ResearchStatus = 'PENDING' | 'RESEARCHING' | 'COMPLETED' | 'FAILED'

export interface Messstelle {
  id: string
  titel: string
  verstossArt: VerstossArt
  bundesland: string
  ort: string
  autobahn: string | null
  abschnitt: string | null
  kilometer: string | null
  slug: string
  beschreibung: string | null
  standortBeschreibung: string | null
  geraeteBeschreibung: string | null
  einspruchBeschreibung: string | null
  faq: FaqItem[] | null
  bussgeldTabelle: BussgeldEintrag[] | null
  researchStatus: ResearchStatus
  researchError: string | null
  behoerde: Behoerde | null
  behoerdeId: string | null
  istVeroeffentlicht: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Behoerde {
  id: string
  name: string
  bundesland: string
  adresse: string | null
  plz: string | null
  stadt: string | null
  telefon: string | null
  email: string | null
  website: string | null
  beschreibung: string | null
  slug: string
  createdAt: Date
  updatedAt: Date
}

export interface FaqItem {
  frage: string
  antwort: string
}

export interface BussgeldEintrag {
  kategorie: string
  geschwindigkeit?: string
  innerorts?: string
  ausserorts?: string
  autobahn?: string
  punkte?: string
  fahrverbot?: string
}

export const BUNDESLAENDER = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const

export type Bundesland = (typeof BUNDESLAENDER)[number]

export const VERSTOSS_LABELS: Record<VerstossArt, string> = {
  GESCHWINDIGKEIT: 'Geschwindigkeitsverstoß',
  ABSTAND: 'Abstandsverstoß',
  ROTLICHT: 'Rotlichtverstoß',
}

export const VERSTOSS_COLORS: Record<VerstossArt, string> = {
  GESCHWINDIGKEIT: 'bg-orange-100 text-orange-800 border-orange-200',
  ABSTAND: 'bg-blue-100 text-blue-800 border-blue-200',
  ROTLICHT: 'bg-red-100 text-red-800 border-red-200',
}

export const BUNDESLAND_KUERZEL: Record<string, string> = {
  'Baden-Württemberg': 'BW',
  Bayern: 'BY',
  Berlin: 'BE',
  Brandenburg: 'BB',
  Bremen: 'HB',
  Hamburg: 'HH',
  Hessen: 'HE',
  'Mecklenburg-Vorpommern': 'MV',
  Niedersachsen: 'NI',
  'Nordrhein-Westfalen': 'NW',
  'Rheinland-Pfalz': 'RP',
  Saarland: 'SL',
  Sachsen: 'SN',
  'Sachsen-Anhalt': 'ST',
  'Schleswig-Holstein': 'SH',
  Thüringen: 'TH',
}
