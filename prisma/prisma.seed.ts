import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { AuthService } from 'src/auth/auth.service'
import { SignupDto } from 'src/auth/dto/signup.dto'
import { CreateShopDto } from 'src/pos/shop/shop.dto'
import { ShopService } from 'src/pos/shop/shop.service'
import { UserService } from 'src/user/user.service'

const { log } = console
interface ServicesDict {
  authService: AuthService
  userService: UserService
  shopService: ShopService
}

type SeedUser = SignupDto & {
  id: string
}

type SeedShop = CreateShopDto & {
  owner_email: string
  id?: string
}

const users: SeedUser[] = [
  {
    id: '',
    email: '3dida@remal.dev',
    password: 'securepassword',
    language: 'en',
  },
  {
    id: '',
    email: 'abjd@remal.dev',
    password: 'securepassword',
    language: 'ar',
  },
  {
    id: '',
    email: 'abky@remal.dev',
    password: 'securepassword',
    language: 'en',
  },
  {
    id: '',
    email: 'slm@remal.dev',
    password: 'securepassword',
    language: 'ar',
  },
  {
    id: '',
    email: 'drd@remal.dev',
    password: 'securepassword',
    language: 'ar',
  },
]

const shops: SeedShop[] = [
  {
    name: 'Lmahal',
    owner_email: '3dida@remal.dev',
  },
  {
    name: 'Crayon Office',
    owner_email: 'abjd@remal.dev',
  },
  {
    name: 'Wiam Library',
    owner_email: 'abky@remal.dev',
  },
  {
    name: 'Talib Library',
    owner_email: 'slm@remal.dev',
  },
  {
    name: 'CHEMIN TAFILALET',
    owner_email: 'drd@remal.dev',
  },
]

async function seedUsers(services: ServicesDict) {
  const seededUsers: (SignupDto & { id: string })[] = []

  for (const userData of users) {
    let user = await services.userService.getUserByEmail(userData.email)

    if (!user) {
      await services.authService.signup(userData, true)
      user = await services.userService.getUserByEmail(userData.email)
    }

    if (!user) {
      throw new Error(`Failed to seed user: ${userData.email}`)
    }

    seededUsers.push({ ...userData, id: user.id })
  }

  return seededUsers
}

async function seedShops(usersWithId: SeedUser[], services: ServicesDict) {
  const seededShops: SeedShop[] = []

  for (const shopData of shops) {
    const owner = usersWithId.find((u) => u.email === shopData.owner_email)

    if (!owner) {
      throw new Error(`Owner not found: ${shopData.owner_email}`)
    }

    const existing = await services.shopService.getShopsByOwnerId(owner.id)

    let shop = existing.find((s) => s.name === shopData.name)

    if (!shop) {
      shop = await services.shopService.createShop(
        { name: shopData.name },
        owner.id,
      )
    }

    seededShops.push({ ...shopData, id: shop.id })
  }

  return seededShops
}
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule)

  const services = {
    authService: app.get(AuthService),
    userService: app.get(UserService),
    shopService: app.get(ShopService),
  }

  const users = await seedUsers(services)
  const shops = await seedShops(users, services)

  log(users, shops)

  await app.close()
}

async function bootstrap() {
  try {
    await main()
    console.log('Seeding completed.')
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

bootstrap()
