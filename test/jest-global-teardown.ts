async function globalTeardown() {
  await globalThis.postgresContainer.stop()
}

export default globalTeardown
