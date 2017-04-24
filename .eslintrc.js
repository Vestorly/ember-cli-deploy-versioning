module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 8,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended'
  ],
  env: {
    browser: true,
    node: true,
    embertest: true
  },
  // 0 is ignore
  // 1 is warn
  // 2 is error
  rules: {
    'arrow-parens': [2, 'as-needed'],
    'brace-style': [2, '1tbs', { 'allowSingleLine': true }],
    'indent': [2, 2, { 'VariableDeclarator': { 'var': 2, 'let': 2, 'const': 3 } }],
    'max-statements-per-line': [2, { 'max': 2 }],
    'one-var-declaration-per-line': 1,
    'one-var': [2, { var: 'never', let: 'never', const: 'never' }],
    'operator-linebreak': [2, 'after'],
    'new-cap': 2,
    'prefer-const': 2,
    'space-before-function-paren': [2, {
      'anonymous': 'never',
      'named': 'never'
      }
    ],
    'quotes': [2, 'single', {
      'avoidEscape': true,
      'allowTemplateLiterals': true
      }
    ],
  }
};
