'use strict';

angular.module('docApp').directive('pre', function () {
  return {
    restrict: 'E',
    terminal: true,
    primary: 1000,
    /* global prettyPrintOne */
    link: function ($scope, $elem) {
      var code = $elem.find('code');
      var formatted = prettyPrintOne(code.html());
      $elem.addClass('prettyprint');
      code.html(formatted);
    }
  };
});
