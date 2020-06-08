module.exports = {
  // extends: 'eslint:recommended',
  // env: {
  //   node: true,
  // },
  // rules: {
  //   'no-console': 'off',
  //   'indent': [ 'error', 2 ],
  // }
  root: true,
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'indent': 'off',
    // allsow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/no-parsing-error': [2, {
      'x-invalid-end-tag': false
    }],
    'no-undef': 'off',
    'camelcase': 'off',
    'space-before-function-paren': ['error', {
      'anonymous': 'never',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    'vue/valid-v-else-if': 'off',
    // 'no-tabs': 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
