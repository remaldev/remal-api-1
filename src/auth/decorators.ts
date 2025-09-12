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
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user

    return (data ? user?.[data] : user) as AuthenticatedUser
  },
)
