import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  { ignores: ['build/**', 'node_modules/**'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // Plain JS codebase without PropTypes; use TypeScript if you want static props.
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      // Opinionated compiler rule; this codebase resets UI from props/open in effects often.
      'react-hooks/set-state-in-effect': 'off',
      // API layer often uses try/catch for uniform rethrow; not worth churning every caller.
      'no-useless-catch': 'off',
      // Prefer typographic entities in copy when it matters; not enforced repo-wide.
      'react/no-unescaped-entities': 'off',
      // Empty catch/fallback branches are sometimes intentional.
      'no-empty': 'off',
      // Handled by unused-imports (avoids duplicate reports for imports).
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
