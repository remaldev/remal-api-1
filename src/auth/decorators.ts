import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common'
import { Role } from './enums'
import { AuthenticatedUser } from './interfaces'

export const IS_PUBLIC_KEY = 'isPublic'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

export const CurrentUser = createParamDecorator(
  (_data: string, ctx: ExecutionContext) => {
    // to use data parameter if needed in the future
    // declare the decorator like that @CurrentUser('email') email: string
    // so you can access the email directly
    // data = 'email' then u can access it like that user[data]
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    return user as AuthenticatedUser
  },
)
