angular.module('superdesk.config', [])
    .provider('defaultConfig', ['config', function(config) {
        /**
         * Set default config value for given key
         *
         * key can contain dots, eg. `editor.toolbar`
         *
         * @param {String} key
         * @param {String} val
         */
        this.set = function(key, val) {
            var dest = config;
            var keyPieces = key.split('.');

            for (var i = 0; i + 1 < keyPieces.length; i++) {
                var k = keyPieces[i];

                if (!dest.hasOwnProperty(k)) {
                    dest[k] = {};
                }

                dest = dest[k];
            }

            var lastKey = keyPieces[keyPieces.length - 1];

            if (!dest.hasOwnProperty(lastKey)) {
                dest[lastKey] = val;
            }
        };

        // used only to modify config, noting to return
        this.$get = angular.noop;
    }])

    .run(['$rootScope', 'config', function($rootScope, config) {
        $rootScope.config = config || {};
    }]);
