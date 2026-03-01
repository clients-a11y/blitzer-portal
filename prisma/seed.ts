import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@blitzer-portal.de'
  const password = process.env.ADMIN_PASSWORD || 'changeme123'
  const name = 'Administrator'

  const existingUser = await prisma.adminUser.findUnique({ where: { email } })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(password, 12)
    await prisma.adminUser.create({
      data: { email, password: hashedPassword, name },
    })
    console.log(`✅ Admin-User erstellt: ${email}`)
  } else {
    console.log(`ℹ️  Admin-User existiert bereits: ${email}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
