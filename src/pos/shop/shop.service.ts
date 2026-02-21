import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateShopDto, ShopResponseDto, toShopResponseDto } from './shop.dto'

@Injectable()
export class ShopService {
  private readonly prismaService: PrismaService

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService
  }

  async createShop(
    createShopDto: CreateShopDto,
    ownerId: string,
  ): Promise<ShopResponseDto> {
    const total_shops_by_owner = await this.prismaService.shop.count({
      where: { ownerId },
    })
    if (total_shops_by_owner >= 1) {
      //  throw status code for limit reached (409 Conflict)
      throw new ConflictException(
        'Shop creation limit reached for this owner (1 shop max).',
      )
    }
    const shop = await this.prismaService.shop.create({
      data: {
        name: createShopDto.name,
        ownerId: ownerId,
      },
    })
    return toShopResponseDto(shop)
  }

  async getShopById(id: string): Promise<ShopResponseDto | null> {
    const shop = await this.prismaService.shop.findUnique({
      where: { id },
    })
    return shop ? toShopResponseDto(shop) : null
  }
}
