module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!<rootDir>/node_modules/',
    '!<rootDir>/build/',
    '!<rootDir>/src/index.ts',
    '!<rootDir>/*.js'
  ],
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/test/tsconfig.json',
      packageJson: 'package.json'
    }
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/build/']
};
