import _ from 'lodash';

export function isMediaEditable(config) {
    return _.get(config, 'features.editFeaturedImage', true) === true;
}

/* globals __SUPERDESK_CONFIG__: true */
export const appConfig = __SUPERDESK_CONFIG__;

DeployConfigFactory.$inject = ['api', '$q'];
function DeployConfigFactory(api, $q) {
    /**
     * Deploy config service
     *
     * provides deployment related config from server
     */
    class DeployConfig {
        config: any;
        promise: any;

        constructor() {
            this.config = null;
            this.promise = null;
        }

        /**
         * Get whole config
         *
         * @return {Promise}
         */
        fetch() {
            if (this.config) {
                return $q.when(this.config);
            }

            if (!this.promise) {
                this.promise = api.query('client_config', {})
                    .then((response) => {
                        this.config = response.config;
                        return this.config;
                    });
            }

            return this.promise;
        }

        /**
         * Get specific key
         *
         * @param {string} key
         * @return {Promise}
         */
        get(key) {
            return this.fetch().then(() => this.getSync(key));
        }

        /**
         * Get sync
         *
         * @param {string} key
         * @param {mixed} defaultValue
         * @return {mixed}
         */
        getSync(key, defaultValue?) {
            if (!this.config) {
                return defaultValue;
            }

            return _.get(this.config, key, defaultValue);
        }

        /**
         * Get multiple values at once
         *
         * @param {Object} spec
         * @return {Promise}
         */
        all(spec) {
            return this.fetch().then((config) => _.mapValues(spec, (key) => this.getSync(key)));
        }
    }

    return new DeployConfig();
}

angular.module('superdesk.config', ['superdesk.core.api'])
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

    .factory('deployConfig', DeployConfigFactory)

    .run(['$rootScope', 'config', 'deployConfig', function($rootScope, config, deployConfig) {
        $rootScope.config = config || {};
        deployConfig.fetch();
    }]);
