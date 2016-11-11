'use strict';
var DOCS_OVERWRITELINK = true;

angular.module('docApp', ['ngMaterial'])
.constant('DOCS_OVERWRITELINK', typeof DOCS_OVERWRITELINK === 'undefined' ? false : DOCS_OVERWRITELINK)
.constant('SEARCH', [])
.provider('DOCS_OVERWRITELINK', function (DOCS_OVERWRITELINK) {
    return {
        $get: function () {
            return DOCS_OVERWRITELINK;
        }
    };
})
.config(function($locationProvider, DOCS_OVERWRITELINK){
    if(!DOCS_OVERWRITELINK){
        $locationProvider.hashPrefix('!');
            $locationProvider.html5Mode({
            enabled: true,
            requireBase: true,
            rewriteLinks: true
        });
    }
})
.config(function($provide, DOCS_NAVIGATION, DOCS_AREA_DATA) {
    // configure navbar navigation
    var nav = DOCS_AREA_DATA.map(function (id) {
        var nav = DOCS_NAVIGATION[id];
        return {
            title: nav.name,
            href: nav.id,
            path: nav.path,
            key: nav.id,
            fullscreen: nav.fullscreen
        };
    })

    $provide.constant('NAV', nav);
})
.config(function($mdThemingProvider) {
    // default theme
    $mdThemingProvider.theme('default')
        .primaryPalette('grey')
        .accentPalette('red');
})
.run(function($location, CONFIG){
    // show api root by default
    if(!$location.path() && CONFIG.ROOT) {
        $location.path(CONFIG.ROOT).replace();
    }
})
.run(function($http, $q, $window, SEARCH){
    $q.all({
        i: $http.get('data/search.index'),
        m: $http.get('data/search-meta.js')
    }).then(function(d) {
        var buffer = $window.dcodeIO.ByteBuffer.fromBinary(d.i.data);
        d.m.data.forEach(function(v) {
            var i = v.size;
            var arr = [];
            while (i--) {
                arr.push(buffer.readInt32());
            }
            SEARCH.push({
                path: v.path,
                name: v.name,
                type: v.type,
                filter: new $window.BloomFilter(
                    arr,
                    Math.ceil(Math.log2(1/0.001))
                )
            });
        });
    });
})
;