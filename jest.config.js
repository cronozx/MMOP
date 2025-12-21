export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^electron-store$': '<rootDir>/tests/__mocks__/electron-store.js',
  },
  testMatch: ['**/tests/**/*.test.js'],
};
