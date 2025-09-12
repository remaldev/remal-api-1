import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators'
import { Role } from '../enums'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector: Reflector

  constructor(reflector: Reflector) {
    this.reflector = reflector
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    return requiredRoles.some((role) => user.role === role)
  }
}
