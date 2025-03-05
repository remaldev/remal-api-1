async function globalTeardown() {
  if (process.env.CI !== 'true') {
    await globalThis.postgresContainer.stop()
    await globalThis.mongoContainer.stop()
  }
}

export default globalTeardown
