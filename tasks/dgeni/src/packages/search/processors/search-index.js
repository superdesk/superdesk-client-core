'use strict';

var _ = require('lodash');
var stemmer = require('stemmer');
var tokenizer = require('keyword-extractor');
var decode = require('ent/decode');
var bloom = require('bloomfilter');
var ByteBuffer = require("bytebuffer");

module.exports = function generateSearchIndexProcessorFactory(aliasMap, log, renderMarkdown) {
  /**
   *  Removes code blocks, tags and other useless content from string
   */
  function cleanText(md) {
    var res = '';
    if (md) {
      res = decode(md.replace(/[\r\n]+/g, ' ').replace(/<code.+?code>/mgi, ' ').replace(/<.+?>/gm, ' '));
    }
    return res;
  }

  var debug = log.debug;

  var errorRate = 0.001;

  return {
    $runAfter: ['inlineTagProcessor'],
    $runBefore: ['writing-files'],
    errorRate: function (v) {
      if (v) {
        errorRate = v;
        return this;
      }
      return errorRate;
    },
    $process: function generateSearchIndexProcessor (docs) {

      var tokens = [];
      var buffer = new ByteBuffer(0);

      var index = docs.filter(function (v) {
        // build search index for rendered docs only
        // do not dig down to the document sources
        // and skip extra content
        return ['componentGroup', 'config', 'nav-data', 'website'].indexOf(v.docType) < 0 &&
               !!v.renderedContent;
      }).map(function(v) {
        // for each document extract only certain properties
        var index = tokenizer.extract(
          ['events', 'properties', 'methods', 'name', 'codeName', 'renderedContent', 'docType'].map(function(k) {
            if ('string' === typeof v[k]) {
              // rendered content should be cleaned a bit
              return 'renderedContent' === k ? cleanText(v[k]) : v[k];
            } else if (v[k]) {
              var m = v[k];
              return [m.codeName || '',
                      m.name || '',
                      cleanText(m.renderedContent || ''),
                      m.alias || '',
                      m.eventTarget || '',
                      m.eventType || ''
              ].join(' ');
            } else {
              return '';
            }
          }).join(' ').replace(/(\$(\w+))/g, '$1 $2'), {
          language: "english",
          remove_digits: true,
          return_changed_case: true,
          remove_duplicates: true
        });

        var filter = new bloom.BloomFilter(
          Math.ceil(index.length * Math.abs(Math.log(errorRate)) / (Math.pow(Math.LN2, 2))),
          Math.ceil(Math.log2(1/errorRate)));

        index.forEach(function(v) {
          filter.add(v);
        })

        buffer.ensureCapacity(buffer.limit + filter.buckets.length*4);

        // append filter
        // use lodash for node <4.0 compat because buckets is a typed array
        // TODO: revert to array method by the end of node 0.12 LTS (https://github.com/nodejs/LTS#lts_schedule)
        _.forEach(filter.buckets, function(v) {
          buffer.writeInt32(v);
        })

        // update index
        tokens.push({
          name: v.name,
          path: v.areaKey || v.path,
          type: v.docType,
          size: filter.buckets.length
        });
      });

      docs.push({
        docType: 'search-data-index',
        id: 'search-index',
        name: 'search.index',
        renderedContent: buffer.toBinary(0,buffer.offset)
      });

      docs.push({
        docType: 'search-data',
        id: 'search-meta',
        renderedContent: JSON.stringify(tokens)
      });
    }
  };
};
