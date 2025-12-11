import path from 'node:path'
import { defineConfig } from 'prisma/config'
import configuration from './src/config/configuration'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'node prisma/prisma.seed.ts',
  },
  datasource: {
    url: configuration().DB_POSTGRE_URI as string,
  },
})
