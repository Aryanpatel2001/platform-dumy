/**
 * Jest Configuration
 * 
 * Test configuration for email marketing tests
 * Supports ES modules
 */

export default {
  testEnvironment: 'node',
  transform: {},
  // extensionsToTreatAsEsm not needed since package.json has "type": "module"
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'services/emailService.js',
    'services/templateService.js',
    'db/repositories/emailRepository.js',
    'routes/emailMarketing.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  verbose: true
};

