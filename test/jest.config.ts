import type { Config as JestConfigTypes } from '@jest/types'
import type { Config as JestConfig } from 'jest'

const buildProject = (
  folderName: string,
): JestConfigTypes.InitialProjectOptions => ({
  displayName: folderName,
  ...(folderName === 'e2e' && {
    globalSetup: '<rootDir>/test/jest-global-setup.ts',
    globalTeardown: '<rootDir>/test/jest-global-teardown.ts',
  }),
  rootDir: '.',
  testMatch: [
    folderName === 'e2e'
      ? '<rootDir>/test/**/*.e2e-spec.ts'
      : '<rootDir>/src/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
})

const jestConfig: JestConfig = {
  rootDir: '.',
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.mock.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.test.ts',
    '!<rootDir>/src/**/*.d.ts',
  ],
  coverageReporters: ['text', 'json', 'cobertura', 'lcov', 'html'],
  coverageDirectory: '../coverage',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/lib/',
    '<rootDir>/tmp/',
  ],
  projects: [buildProject('unit'), buildProject('e2e')],
  silent: true,
  testEnvironment: 'node',
  verbose: false,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
}
export default jestConfig
