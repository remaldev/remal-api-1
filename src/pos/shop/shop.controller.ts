import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CurrentUser } from '../../auth/decorators'
import { CreateShopDto } from './shop.dto'
import { ShopService } from './shop.service'

@Controller('shops')
export class ShopController {
  private readonly shopService: ShopService

  constructor(shopService: ShopService) {
    this.shopService = shopService
  }

  @Post('/')
  create(
    @Body() createShopDto: CreateShopDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shopService.createShop(createShopDto, userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.getShopById(id)
  }
}
