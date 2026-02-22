import { ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { isObservable, lastValueFrom } from 'rxjs'
import { UserService } from '../../user/user.service'
import { IS_PUBLIC_KEY } from '../decorators'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly userService: UserService
  private readonly reflector: Reflector
  private readonly logger = new Logger(JwtAuthGuard.name)
  constructor(reflector: Reflector, userService: UserService) {
    super()
    this.reflector = reflector
    this.userService = userService
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    if (process.env.NODE_ENV === 'local') {
      // TODO: remove this hardcoded user loading in dev mode only
      const req = context.switchToHttp().getRequest()
      const user = await this.userService.getUserByEmail('3dida@remal.dev')

      if (!user) {
        return false
      }
      this.logger.log(`Authenticated user: ${JSON.stringify(user)}`)
      req.user = user
      return true
    }

    const result = super.canActivate(context)

    // AuthGuard('jwt').canActivate() may return boolean | Promise<boolean> | Observable<boolean>.
    // Since this override is async and must return Promise<boolean>, we normalize the result.
    // If it's an Observable, convert it to a Promise<boolean> with lastValueFrom().
    // isObservable(): An RxJS Observable is an object that represents a stream of values over time.
    if (isObservable(result)) {
      return await lastValueFrom(result)
    }

    return result // <--- promise
  }
}
