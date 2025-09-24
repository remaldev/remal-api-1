import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

interface SuccessEnvelope<T> {
  success: true
  message?: string
  data: T
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((original) => {
        // If controller already returned an envelope with success true, pass through
        if (
          original &&
          typeof original === 'object' &&
          'success' in original &&
          original.success === true &&
          'data' in original
        ) {
          return original
        }

        // If controller returned a primitive or array, wrap as data
        const payload: SuccessEnvelope<unknown> = {
          success: true,
          data: original,
        }
        return payload
      }),
    )
  }
}
