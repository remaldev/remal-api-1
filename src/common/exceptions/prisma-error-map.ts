import { HttpStatus } from '@nestjs/common'
import { Prisma } from '@prisma/client'

export interface PrismaErrorInfo {
  status: HttpStatus
  message: string
  error: string
}

/**
 * Maps Prisma error codes to HTTP error responses
 * @param exception The Prisma exception
 * @returns Error information with status, message and error type
 */
export function getPrismaErrorInfo(
  exception: Prisma.PrismaClientKnownRequestError,
): PrismaErrorInfo {
  switch (exception.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: 'A record with this data already exists',
        error: 'Conflict',
      }
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        error: 'Not Found',
      }
    case 'P2003': // Foreign key constraint failed
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Related record does not exist',
        error: 'Bad Request',
      }
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `Database error: ${exception.code}`,
        error: 'Database Error',
      }
  }
}
