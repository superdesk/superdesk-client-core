/**
 * When specified on the document, prevents havigation to be shown
 */
module.exports = function() {
  return {
    name: 'fullscreen',
    transforms: [function (doc) { return true; }]
  };
};