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

  getProducts(shopId: string, page: number, limit: number) {
    return this.prismaService.product.findMany({
      where: {
        shopId: shopId,
      },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  getProductById(productId: string, shopId: string) {
    return this.prismaService.product.findFirstOrThrow({
      where: {
        id: productId,
        shopId: shopId,
      },
    })
  }

  getProductByBarcode(barcode: string, shopId: string) {
    return this.prismaService.product.findFirstOrThrow({
      where: {
        barcode: barcode,
        shopId,
      },
    })
  }
}
