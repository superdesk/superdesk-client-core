/* jshint ignore:start */
var tansa = {
    settings: {
        // tansa server base urls e.g 'http://localhost:8080/tansaclient/'
        baseUrl: `${location.protocol}//${location.host}/tansaclient/`,
        clientExtenstionJs: 'tansa4ClientExtensionSimple.js',
        // need to populate dynamically
        tansaUserId: 'tansa',
        checkboxPreference: false,
        parentAppName: window.testPageParentAppName
    }
};

// tansa apparently likes to polute window scope
window.tansa = tansa;

function afterProofing (isCancelled) {
    var $rootScope = angular.element(document.body).injector().get('$rootScope');

    $rootScope.$apply(function () {
        $rootScope.config.isCheckedByTansa = true;
        $rootScope.publishAfterTansa();
    });
}

var script = document.createElement('script');
script.src = `${tansa.settings.baseUrl}tansaLoader.js?${new Date().getTime()}`;
document.write(script.outerHTML);
/* jshint ignore:end */
