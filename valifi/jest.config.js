export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/backend/src/__mocks__/setup.ts'],
  testMatch: ['<rootDir>/backend/src/__tests__/**/*.test.ts'],
};