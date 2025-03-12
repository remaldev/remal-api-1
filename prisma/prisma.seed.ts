import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  return new Promise((resolve) => {
    console.log('Database seeded')
    resolve(1)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
