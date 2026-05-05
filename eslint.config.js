import pluginVue from 'eslint-plugin-vue'

export default [
  // Apply vue3-recommended rules to .vue files
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,vue}', 'tests/**/*.{js,vue}'],
    rules: {
      // Vue-specific overrides
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      // General JS
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'pnpm-lock.yaml',
    ],
  },
]
