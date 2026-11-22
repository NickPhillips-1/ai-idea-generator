const tseslint = require('typescript-eslint');

const featureBoundaryMessage =
  'Feature code may import findings/finding-review only. Cross-feature navigation uses the router and LabApi or SessionApi.';

module.exports = tseslint.config(
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['src/app/features/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common/http',
              message:
                'Feature code calls LabApi or SessionApi in core/api/. Do not import HttpClient from @angular/common/http.',
            },
            {
              name: 'rxjs',
              importNames: ['timer'],
              message:
                'Job polling lives in core/research/poll-job.ts (pollJob). Do not import timer in feature code.',
            },
            {
              name: 'rxjs/timer',
              message:
                'Job polling lives in core/research/poll-job.ts (pollJob). Do not import timer in feature code.',
            },
          ],
          patterns: [
            {
              group: [
                '../alignments',
                '../alignments/**',
                '../dashboard',
                '../dashboard/**',
                '../directions',
                '../directions/**',
                '../login',
                '../login/**',
                '../opportunities',
                '../opportunities/**',
                '../questionnaires',
                '../questionnaires/**',
                '../research',
                '../research/**',
                '**/features/alignments',
                '**/features/alignments/**',
                '**/features/dashboard',
                '**/features/dashboard/**',
                '**/features/directions',
                '**/features/directions/**',
                '**/features/login',
                '**/features/login/**',
                '**/features/opportunities',
                '**/features/opportunities/**',
                '**/features/questionnaires',
                '**/features/questionnaires/**',
                '**/features/research',
                '**/features/research/**',
              ],
              message: featureBoundaryMessage,
            },
          ],
        },
      ],
    },
  },
);
