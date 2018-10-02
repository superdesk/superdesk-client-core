/*
 * This module enables the 'tansa' spellchecker functionality and installs
 * it based on the documentation provided by the user guide.
 */

/* jshint ignore:start */
document.write(`
    <script type="text/javascript">
        var tansa = {
            settings: {
                // tansa server base urls e.g 'http://localhost:8080/tansaclient/'
                baseUrl: '${location.protocol}//${location.host}/tansaclient/',
                clientExtenstionJs: 'tansa4ClientExtensionSimple.js',
                // need to populate dynamically
                tansaUserId: 'tansa',
                checkboxPreference: false,
                parentAppId: '02d65e3e-f62d-41f9-92c6-ffaf16bf209e',
                licenseKey: '10747a8a5016-95b1-4d4c-846b-f34347e8f288'
            }
        };

        // tansa apparently likes to polute window scope
        window.tansa = tansa;

        function afterProofing (isCancelled) {
            let $rootScope = angular.element(document.body).injector().get('$rootScope');
            $rootScope.$broadcast('tansa:after', isCancelled);
            $rootScope.$broadcast('tansa:end', isCancelled);
        }
    </script>
`);

var script = document.createElement('script');

script.src = `${location.protocol}//${location.host}/tansaclient/tansaLoader.js?${new Date().getTime()}`;
document.write(script.outerHTML);

document.write(`
     <script type="text/javascript">
        var pgwBrowser = tansaJQuery.pgwBrowser();
        window.tansa.settings.platformName = pgwBrowser.os.name;
        window.tansa.settings.platformVersion = pgwBrowser.os.fullVersion;
     </script>
`);
/* jshint ignore:end */
