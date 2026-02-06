/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*']
        }
      }
    }]
  },
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.{test,spec}.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^vscode$': '<rootDir>/tests/mocks/vscode.js'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/ui/**',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/out/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-jest.ts'],
  testTimeout: 10000,
  verbose: true
};
