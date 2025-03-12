import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { getPrismaErrorInfo } from '../exceptions/prisma-error-map'

interface ExceptionObjectResponse {
  message?: string
  error?: string
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  constructor() {
    if (process.env.NODE_ENV === 'test') {
      this.logger.localInstance.error = () => undefined
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Default error response structure
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'Internal Server Error'

    // Handle known HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse() as
        | ExceptionObjectResponse
        | string

      if (typeof exceptionResponse === 'object') {
        message = exceptionResponse.message || exception.message
        error = exceptionResponse.error || 'Error'
      } else {
        message = exception.message
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const errorInfo = getPrismaErrorInfo(exception)
      status = errorInfo.status
      message = errorInfo.message
      error = errorInfo.error
    }

    this.logger.error(`${request.method} ${request.url} - ${status} ${message}`)
    if (exception instanceof Error) {
      this.logger.error(exception.stack)
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
