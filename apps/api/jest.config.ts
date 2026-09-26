module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Unit tests live alongside source files as *.spec.ts.
  // e2e tests (apps/api/test/e2e) are run separately via jest.e2e.config.ts.
  testMatch: ['**/src/**/*.spec.ts'],
  clearMocks: true,
};
