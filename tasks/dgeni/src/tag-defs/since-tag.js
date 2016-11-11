module.exports = function(trimWhitespaceTransform) {
  return {
    name: 'since',
    transforms: [ trimWhitespaceTransform ]
  };
};