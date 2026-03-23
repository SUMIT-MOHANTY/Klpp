module.exports = {
  ...require('./test-config.js'),
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.(js|jsx|ts|tsx)', '**/__tests__/**/*.(js|jsx|ts|tsx)']
};
