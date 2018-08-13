const sharedConfigs = require('superdesk-code-style');

module.exports = Object.assign({}, sharedConfigs, {parser: 'typescript-eslint-parser'})