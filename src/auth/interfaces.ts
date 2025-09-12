export interface JwtPayload {
  sub: string // User ID
  email: string
  role: string // User Role defined in Prisma schema
  isVerified: boolean
  iat: number
  exp: number
}
