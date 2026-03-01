import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function extractBundesland(titel: string): string | null {
  const bundeslaender: Record<string, string[]> = {
    Bayern: ['A3', 'A6', 'A7', 'A8', 'A9', 'A92', 'A93', 'A94', 'A95', 'A96', 'A99'],
    'Baden-Württemberg': ['A5', 'A6', 'A7', 'A8', 'A81', 'A98'],
    'Nordrhein-Westfalen': ['A1', 'A2', 'A3', 'A4', 'A40', 'A43', 'A44', 'A45', 'A46'],
    Niedersachsen: ['A1', 'A2', 'A7', 'A27', 'A28', 'A29', 'A30', 'A31'],
    Hessen: ['A3', 'A4', 'A5', 'A7', 'A45', 'A60', 'A66'],
    'Rheinland-Pfalz': ['A1', 'A3', 'A6', 'A6', 'A8', 'A60', 'A61', 'A62', 'A63'],
    'Sachsen': ['A4', 'A13', 'A14', 'A17', 'A72'],
    Thüringen: ['A4', 'A9', 'A71', 'A73'],
    Brandenburg: ['A2', 'A9', 'A10', 'A11', 'A12', 'A13', 'A15'],
    'Mecklenburg-Vorpommern': ['A19', 'A20', 'A24'],
    'Schleswig-Holstein': ['A1', 'A7', 'A20', 'A21', 'A23'],
    Hamburg: ['A1', 'A7', 'A23', 'A24', 'A25', 'A26'],
    Berlin: ['A10', 'A100', 'A111', 'A113', 'A114', 'A115'],
    'Sachsen-Anhalt': ['A2', 'A9', 'A14', 'A38'],
    Saarland: ['A1', 'A6', 'A8', 'A620'],
    Bremen: ['A1', 'A27', 'A28'],
  }

  for (const [land, autobahnen] of Object.entries(bundeslaender)) {
    for (const ab of autobahnen) {
      if (titel.includes(ab)) {
        return land
      }
    }
  }
  return null
}

export function extractAutobahn(titel: string): string | null {
  const match = titel.match(/\b(A\d{1,3})\b/)
  return match ? match[1] : null
}

export function extractOrt(titel: string): string {
  const parts = titel.split(',')
  if (parts.length > 0) {
    return parts[0].trim()
  }
  return titel
}

export function bundeslandToSlug(bundesland: string): string {
  return slugify(bundesland)
}

export function ortToSlug(ort: string): string {
  return slugify(ort)
}
