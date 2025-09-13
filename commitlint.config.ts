module.exports = {
  parserPreset: {
    parserOpts: {
      headerCorrespondence: ['type', 'scope', 'subject'],
      headerPattern: /^(\w+)(?:\(([\w-]+)\))?: (.+)$/,
    },
  },
  rules: {
    'subject-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refact',
        'revert',
        'style',
        'test',
      ],
    ],
  },
}
