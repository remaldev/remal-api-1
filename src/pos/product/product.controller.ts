import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentShop } from '../shop/shop.decorator'
import { ShopResponseDto } from '../shop/shop.dto'
import { ShopContextGuard } from '../shop/shop.guard'
import { CreateProductDto } from './product.dto'
import { ProductService } from './product.service'

@UseGuards(ShopContextGuard)
@Controller('products')
export class ProductController {
  private readonly productService: ProductService

  constructor(productService: ProductService) {
    this.productService = productService
  }

  @Post('/')
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentShop() shop: ShopResponseDto,
  ) {
    return this.productService.createProduct(createProductDto, shop.id)
  }
}
