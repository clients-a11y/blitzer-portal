import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://blitzer-portal.de'

  const messstellen = await prisma.messstelle.findMany({
    where: { istVeroeffentlicht: true },
    select: { bundesland: true, slug: true, updatedAt: true },
  })

  const bundeslaender = [...new Set(messstellen.map((m) => m.bundesland))]

  const messstellenUrls: MetadataRoute.Sitemap = messstellen.map((m) => ({
    url: `${baseUrl}/messstellen/${encodeURIComponent(m.bundesland.toLowerCase().replace(/\s/g, '-'))}/${m.slug}`,
    lastModified: m.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const bundeslaenderUrls: MetadataRoute.Sitemap = bundeslaender.map((bl) => ({
    url: `${baseUrl}/messstellen/${encodeURIComponent(bl.toLowerCase().replace(/\s/g, '-'))}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/messstellen`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/suche`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/bussgeldbehoerden`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...bundeslaenderUrls,
    ...messstellenUrls,
  ]
}
