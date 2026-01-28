import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import configuration from '../config/configuration'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: configuration().DB_POSTGRE_URI as string,
      }),
    })
  }
  async onModuleInit() {
    try {
      await this.$connect()
      Logger.log('Successfully connected to the database', 'Prisma')
    } catch (error) {
      Logger.error('Failed to connect to the database:', error, 'Prisma')
    }
  }
}
