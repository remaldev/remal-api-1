import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentShop } from '../shop/shop.decorator'
import { ShopResponseDto } from '../shop/shop.dto'
import { ShopContextGuard } from '../shop/shop.guard'
import { CreateProductDto, UpdateProductDto } from './product.dto'
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

  @Get('/')
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @CurrentShop() shop: ShopResponseDto,
  ) {
    return this.productService.getProducts(shop.id, Number(page), Number(limit))
  }

  @Get('/:productId')
  findById(
    @Param('productId') productId: string,
    @CurrentShop() shop: ShopResponseDto,
  ) {
    return this.productService.getProductById(productId, shop.id)
  }

  @Get('/barcode/:barcode')
  findByBarcode(
    @Param('barcode') barcode: string,
    @CurrentShop() shop: ShopResponseDto,
  ) {
    return this.productService.getProductByBarcode(barcode, shop.id)
  }

  @Patch('/:productId')
  patchProduct(
    @CurrentShop() shop: ShopResponseDto,
    @Param('productId') productId: string,
    @Body('data') updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(
      productId,
      shop.id,
      updateProductDto,
    )
  }
}
