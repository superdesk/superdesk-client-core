/**
 * Defines @sortOrder [weight] tag
 * @type {Object}
 */
module.exports = function sortOrderTagDef() {
  return {
    name: 'sortOrder',
    transforms: function(doc, tag, value) {
      return parseInt(value, 10) || 0;
    },
    defaultFn: function () {
      return 0;
    }
  }
};