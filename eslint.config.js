import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(...tseslint.configs.recommended, {
  plugins: { '@stylistic': stylistic },
  rules: {
    'curly': ['error', 'all'],
    '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    '@stylistic/indent': ['error', 2],
    '@stylistic/quotes': ['error', 'single'],
    '@stylistic/semi': ['error', 'never'],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/arrow-parens': ['error', 'always'],
    '@stylistic/object-curly-spacing': ['error', 'always'],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
})
