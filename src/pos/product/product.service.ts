import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateProductDto } from './product.dto'

@Injectable()
export class ProductService {
  private readonly prismaService: PrismaService

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService
  }

  createProduct(createProductDto: CreateProductDto, shopId: string) {
    return this.prismaService.product.create({
      data: {
        name: createProductDto.name,
        price: createProductDto.price,
        barcode: createProductDto.barcode,
        quantity: createProductDto.quantity ?? 0,
        shopId: shopId,
      },
    })
  }
}
