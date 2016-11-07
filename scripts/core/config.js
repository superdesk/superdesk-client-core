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
            var key_pieces = key.split('.');

            for (var i = 0; i + 1 < key_pieces.length; i++) {
                var k = key_pieces[i];
                if (!dest.hasOwnProperty(k)) {
                    dest[k] = {};
                }

                dest = dest[k];
            }

            var last_key = key_pieces[key_pieces.length - 1];
            if (!dest.hasOwnProperty(last_key)) {
                dest[last_key] = val;
            }
        };

        // used only to modify config, noting to return
        this.$get = angular.noop;
    }])

    .run(['$rootScope', 'config', function($rootScope, config) {
        $rootScope.config = config || {};
    }]);
