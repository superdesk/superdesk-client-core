/**
 * Configures the tansa plug-in globally. It only works by specifying
 * this globally defined variable bound to window.
 */
window.tansa = {
    settings: {
        // tansa server base urls e.g "http://localhost:8080/tansaclient/"
        baseUrl: `${location.protocol}//${location.host}/tansaclient/`,
        clientExtenstionJs: "tansa4ClientExtensionSimple.js",

        //Need to populate dynamically 
        tansaUserId: 'tansa',
        checkboxPreference: false,
        parentAppName: window.testPageParentAppName
    }
};

function afterProofing (isCancelled) {
    var $rootScope = angular.element(document.body).injector().get('$rootScope');

    $rootScope.$apply(function () {
        config.isCheckedByTansa = true;
        $rootScope.publishAfterTansa();
    });
}

var script = document.createElement('script');
script.src = `${tansa.settings.baseUrl}tansaLoader.js?${new Date().getTime()}`;
document.write(script.outerHTML);
