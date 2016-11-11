'use strict';

angular.module('docApp').directive('a', function (DOCS_OVERWRITELINK, DOCS_AREA_DATA) {
  var linkCache = {};
  var isRewrite = function (link) {
    var res = !!link && (link.indexOf('#/') === -1);
    if(!res){
      return false;
    }
    res = false;
    angular.forEach(DOCS_AREA_DATA, function (area) {
      res = res || link.indexOf(area) === 0; 
    });
    return res;
  };
  return {
    restrict: 'E',
    link: function ($scope, $elem) {
      if(!DOCS_OVERWRITELINK){
        return;
      }
      $scope.$evalAsync(function () {
        var link = $elem.attr('href'), newLink;
        newLink = linkCache[link];
        if(!newLink){
          if(isRewrite(link)){
            newLink = '#/' + link;
            linkCache[link] = newLink;
          }
        }
        $elem.attr('href', newLink);
      });
    }
  };
});
