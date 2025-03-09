import type { Config as JestConfigTypes } from '@jest/types'
import type { Config as JestConfig } from 'jest'

const buildProject = (
  folderName: string,
): JestConfigTypes.InitialProjectOptions => ({
  displayName: folderName,
  rootDir: '.',
  testMatch: [
    folderName === 'e2e'
      ? '<rootDir>/test/e2e/**/*.e2e-spec.ts'
      : '<rootDir>/src/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],
})

const jestConfig: JestConfig = {
  rootDir: '../',
  clearMocks: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/*.mock.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.e2e-spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*.d.ts',
  ],
  coverageReporters: [
    'text',
    'json',
    'cobertura',
    'lcov',
    'html',
    'text-summary',
    'json-summary'
  ],
  coverageDirectory: './coverage',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/lib/',
    '<rootDir>/tmp/',
  ],
  globalSetup: '<rootDir>/test/jest-global-setup.ts',
  globalTeardown: '<rootDir>/test/jest-global-teardown.ts',
  projects: [buildProject('unit'), buildProject('e2e')],
  silent: true,
  testEnvironment: 'node',
  verbose: false,
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
}

export default jestConfig
