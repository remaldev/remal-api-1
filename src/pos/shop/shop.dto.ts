import { Shop } from '@prisma/client'
import { plainToClass } from 'class-transformer'

export class CreateShopDto {
  name: string
}

export class ShopResponseDto {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export function toShopResponseDto(shop: Shop): ShopResponseDto {
  return plainToClass(ShopResponseDto, shop, {
    excludeExtraneousValues: false,
  })
}
