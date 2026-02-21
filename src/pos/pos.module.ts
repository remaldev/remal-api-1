import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { ShopModule } from './shop/shop.module'

@Module({
  imports: [
    ShopModule,
    RouterModule.register([
      {
        path: 'pos',
        module: ShopModule,
      },
    ]),
  ],
})
export class PosModule {}
