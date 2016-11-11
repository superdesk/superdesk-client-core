module.exports = function errorTag (errorTagTransform) {
  return {
    name: 'error',
    docProperty: 'error',
    transforms: [errorTagTransform]
  };
};