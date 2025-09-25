import * as Joi from 'joi'

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'prod')
    .default('development'),

  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose', 'fatal')
    .default('log'),

  // Database
  DB_POSTGRE_URI: Joi.string().uri().required(),

  // Auth/JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .default('15m'),

  // CORS / Security
  CORS_ORIGINS: Joi.string()
    .allow('')
    .default('http://localhost:3000,http://localhost:5173'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Throttling
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
})
