/**
 * Processes @error tag
 * Error tag provides separate error area
 *
 * @param  {Tag} tag The tag to process
 */
module.exports = function errorTagTransform(createDocMessage) {
  var area = 'error';

  /**
   * Processes doc and returns correct access value
   * @param {Doc} doc current document
   * @param {Tag} tag tag to process
   * @param {String} tag value
   */
  function transformError (doc, tag, value) {
    doc.area = area;

    return true;
  };

  return transformError;
};