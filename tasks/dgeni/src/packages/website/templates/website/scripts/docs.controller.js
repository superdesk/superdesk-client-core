'use strict';

angular.module('docApp').controller('DocsCtrl', function($scope, $location, $window, CONFIG, DOCS_NAVIGATION){
    var docs = this;
    var basePath = '/';

    docs.currentArea = null;
    docs.currentHash = null;
    docs.partialPath = null;
    docs.fullscreen = false;

    docs.isCurrent = function (navItem) {
        return ('/' + navItem.href === docs.currentPath);
    };

    docs.changeCurrent = function(newPath, hash){
        var area;
        var fullscreen = false;
        docs.currentPath = newPath;
        newPath = newPath.replace(new RegExp('^' + basePath), '');
        area = newPath.split('/')[0];
        docs.currentArea = DOCS_NAVIGATION[area];

        if (newPath === '' || newPath === 'index.html') {
            newPath = 'index';
        }
        if (!newPath.match(/\.html$/)) {
            if (DOCS_NAVIGATION[newPath] && DOCS_NAVIGATION[newPath].href) {
                fullscreen = !!DOCS_NAVIGATION[newPath].fullscreen;
                newPath = DOCS_NAVIGATION[newPath].href;
            }
            newPath = newPath + '.html';
        }
        newPath = 'partials/' + newPath;

        docs.currentHash = hash;
        docs.partialPath = newPath;
        docs.fullscreen = fullscreen;
    };

    $scope.$on('$locationChangeStart', function(){
        docs.changeCurrent($location.path(), $location.hash());
    });

    $scope.$on('$locationChangeSuccess', function () {
        var title = CONFIG.TITLE;
        if (docs.currentArea && docs.currentArea.name) {
            title += " : " + docs.currentArea.name;
        }
        $window.document.title = title;
    });
});

