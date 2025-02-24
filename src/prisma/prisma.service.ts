import { Injectable, type OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      console.log('DATABASE_POSTGRE_URL:', process.env.DATABASE_POSTGRE_URL)

      await this.$connect() // Connect to the database
      console.log('Successfully connected to the database') // Log success message
    } catch (error) {
      console.error('Failed to connect to the database:', error) // Log error if the connection fails
    }
  }
}
