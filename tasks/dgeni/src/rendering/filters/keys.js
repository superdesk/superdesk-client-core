module.exports = function() {
  return {
    name: 'keys',
    process: function(a) { if (a) return Object.keys(a); else return typeof a }
  };
};