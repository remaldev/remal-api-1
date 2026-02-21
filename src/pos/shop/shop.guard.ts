import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { isCuid } from '@paralleldrive/cuid2'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ShopContextGuard implements CanActivate {
  private readonly prisma: PrismaService

  constructor(prisma: PrismaService) {
    this.prisma = prisma
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const shopIdHeader = request.headers['x-shop-id']

    if (!shopIdHeader) {
      throw new BadRequestException('X-Shop-Id header is required')
    }

    if (!isCuid(shopIdHeader)) {
      throw new BadRequestException('Invalid shop id')
    }
    // use shopService to fetch shop by id and ownerId
    const shop = await this.prisma.shop.findFirst({
      where: {
        id: shopIdHeader,
        ownerId: user.id,
      },
      include: {
        owner: {
          select: {
            email: true,
            id: true,
            role: true,
          },
        },
      },
    })

    if (!shop) {
      throw new ForbiddenException('You do not have access to this shop')
    }

    request.shop = shop

    return true
  }
}
