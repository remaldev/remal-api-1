import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DB_POSTGRE_URI'),
        },
      },
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
