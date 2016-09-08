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
                parentAppName: 'superdesk'
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
    </script>
`);

var script = document.createElement('script');
script.src = `${tansa.settings.baseUrl}tansaLoader.js?${new Date().getTime()}`;
document.write(script.outerHTML);

document.write(`
     <script type="text/javascript">
        var pgwBrowser = tansaJQuery.pgwBrowser();
        window.tansa.settings.platformName = pgwBrowser.os.name;
        window.tansa.settings.platformVersion = pgwBrowser.os.fullVersion;
     </script>
`);
/* jshint ignore:end */
