module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    // allow require
    '@typescript-eslint/no-var-requires': 0,
  },
  ignorePatterns: ['src/**/*.test.ts', 'bin/*.js'],
};
