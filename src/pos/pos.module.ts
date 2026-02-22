import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { ProductModule } from './product/product.module'
import { ShopModule } from './shop/shop.module'

@Module({
  imports: [
    ShopModule,
    ProductModule,
    RouterModule.register([
      {
        path: 'pos',
        module: ShopModule,
      },
      {
        path: 'pos',
        module: ProductModule,
      },
    ]),
  ],
})
export class PosModule {}
