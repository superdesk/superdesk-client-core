module.exports = function(extractTypeTransform, extractNameTransform, wholeTagTransform) {
  return {
    name: 'throws',
    aliases: ['throw'],
    multi: true,
    transforms: [ extractTypeTransform, extractNameTransform, wholeTagTransform ]
  };
};