async function globalTeardown() {
  await globalThis.postgresContainer.stop()
  await globalThis.mongoContainer.stop()
}

export default globalTeardown
