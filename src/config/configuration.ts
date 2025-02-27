const getEnvVar = (name: string, nodeEnv: string): string | undefined => {
  const env = process.env
  const prefixedVar = env[`${nodeEnv}_${name}`]
  return prefixedVar || env[name]
}

export default () => {
  const nodeEnv = process.env.NODE_ENV || 'dev'

  return {
    DB_POSTGRE_URI: getEnvVar('DB_POSTGRE_URI', nodeEnv),
    DB_MONGO_URI: getEnvVar('DB_MONGO_URI', nodeEnv),
    LOG_LEVEL: getEnvVar('LOG_LEVEL', nodeEnv),
    PORT: getEnvVar('PORT', nodeEnv),
  }
}
