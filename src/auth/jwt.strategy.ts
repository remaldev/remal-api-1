import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'
import { JwtPayload } from './interfaces'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly prismaService: PrismaService
  private readonly logger = new Logger(JwtStrategy.name)

  constructor(configService: ConfigService, prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    })
    this.prismaService = prismaService
  }

  async validate(payload: JwtPayload) {
    try {
      // Verify user still exists and is verified
      const { sub: userId } = payload
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
        },
      })

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified')
      }

      return user
    } catch (error) {
      if (error.status) {
        throw error
      }
      this.logger.error(`Error validating JWT: ${error.message}`)
      throw new InternalServerErrorException(`Internal server error`)
    }
  }
}
