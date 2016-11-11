var _ = require('lodash');
var path = require('path');

/**
 * @dgService getLinkInfo
 * @description
 * Get link information to a document that matches the given url
 * @kind function
 * @param  {String} url   The url to match
 * @param  {String} title An optional title to return in the link information
 * @return {Object}       The link information
 *
 * @property {boolean} relativeLinks Whether we expect the links to be relative to the originating doc
 */
module.exports = function getLinkInfo(getDocFromAlias, encodeCodeBlock, log) {

  function getLinkInfoImpl(url, title, currentDoc) {
    var linkInfo = {
      url: url,
      type: 'url',
      valid: true,
      title: title || url
    };

    if ( !url ) {
      throw new Error('Invalid url');
    }

    var docs = getDocFromAlias(url, currentDoc);

    if ( !getLinkInfoImpl.useFirstAmbiguousLink && docs.length > 1 ) {

      linkInfo.valid = false;
      linkInfo.errorType = 'ambiguous';
      linkInfo.error = 'Ambiguous link: "' + url + '".\n' +
        docs.reduce(function(msg, doc) { return msg + '\n  "' + doc.id + '" ('+ doc.docType + ') : (' + doc.path + ' / ' + doc.fileInfo.relativePath + ')'; }, 'Matching docs: ');

    } else if ( docs.length >= 1 ) {

      linkInfo.url = docs[0].path;
      linkInfo.title = title || docs[0].name;
      linkInfo.type = 'doc';

      if ( getLinkInfoImpl.relativeLinks && currentDoc && currentDoc.path ) {
        var currentFolder = path.dirname(currentDoc.path);
        var docFolder = path.dirname(linkInfo.url);
        var relativeFolder = path.relative(path.join('/', currentFolder), path.join('/', docFolder));
        linkInfo.url = path.join(relativeFolder, path.basename(linkInfo.url));
        log.debug(currentDoc.path, docs[0].path, linkInfo.url);
      }

    } else if ( url.indexOf('#') > 0 ) {
      var pathAndHash = url.split('#');
      linkInfo = getLinkInfoImpl(pathAndHash[0], title, currentDoc);
      linkInfo.url = linkInfo.url + '#' + pathAndHash[1];
      return linkInfo;

    } else if ( url.indexOf('/') === -1 && url.indexOf('#') !== 0 ) {
      var valid = false;

      // extension point, check url against externals
      if (getLinkInfoImpl.externalLinks) {
        var link = _.find(getLinkInfoImpl.externalLinks, function (link) {
          return link.test(url);
        });
        if (link) {
          linkInfo.url = link.url(url);
          linkInfo.title = title || link.title(url);
          linkInfo.type = 'doc';
          linkInfo.external = true;
          valid = true;
        }
      }

      if (!valid) {
        linkInfo.valid = false;
        linkInfo.errorType = 'missing';
        linkInfo.error = 'Invalid link (does not match any doc): "' + url + '"';
      }
    } else {

      linkInfo.title = title || (( url.indexOf('#') === 0 ) ? url.substring(1) : path.basename(url, '.html'));

    }

    return linkInfo;
  };

  getLinkInfoImpl.externalLinks = [];

  return getLinkInfoImpl;
};