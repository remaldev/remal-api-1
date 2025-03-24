module.exports = {
  parserPreset: {
    parserOpts: {
      headerCorrespondence: ['type', 'scope', 'ticket', 'subject'],
      headerPattern:
        /^\[(\w+)](?:\(([\w-]+)\))?( #[\w-]+)? ([A-Z]+[\w\s,;:!?./§*%$£&"#'(\-|`_\\^@)°+=€]*)$/,
    },
  },
  rules: {
    'subject-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      ['BUILD', 'DOC', 'FAKE', 'FEAT', 'FIX', 'REFACT', 'TEST', 'UPGRADE'],
    ],
  },
};


// Examples:

// [FEAT](auth) #AUTH-123 Add JWT authentication strategy
// [FEAT](user) #USER-456 Implement user registration
// [FEAT](payment) Add Stripe integration

// [FIX](db) #BUG-789 Fix connection timeout issue
// [FIX](cache) Fix Redis cache invalidation
// [FIX](api) Fix rate limiting headers

// [BUILD](docker) Update Node.js base image
// [BUILD](ci) Add GitHub Actions workflow
// [BUILD](deploy) Configure AWS deployment

// [DOC](api) Update API swagger documentation
// [DOC](deps) Update dependency upgrade guide
// [DOC] Update main README

// [TEST](unit) Add user service unit tests
// [TEST](e2e) Add authentication flow tests
// [TEST](api) Add API integration tests

// [REFACT](user) Extract user validation logic
// [REFACT](auth) Improve authentication middleware
// [REFACT](db) Optimize database queries

// [UPGRADE](deps) Update NestJS to v11
// [UPGRADE](pkg) Update testing libraries

// [FAKE](db) Add user seed data
// [FAKE](test) Add mock authentication tokens
