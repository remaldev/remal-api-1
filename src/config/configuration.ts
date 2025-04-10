export default () => {
  return {
    DB_POSTGRE_URI: process.env.DB_POSTGRE_URI,
    DB_MONGO_URI: process.env.DB_MONGO_URI,
    LOG_LEVEL: process.env.LOG_LEVEL,
    PORT: process.env.PORT,
  }
}
