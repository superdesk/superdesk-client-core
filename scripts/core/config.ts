import _ from 'lodash';
import {appConfig} from 'appConfig';
import {IArticle} from 'superdesk-api';

export function isMediaEditable(item?: IArticle) {
    if (item != null) {
        if (item._type != null) {
            return item._type !== 'externalsource';
        } else if (item._fetchable != null) {
            return item._fetchable;
        }
    }

    return (appConfig.features == null || appConfig.features.editFeaturedImage == null
        ? true
        : appConfig.features.editFeaturedImage) === true;
}

/**
 * DEPRECATED
 *
 * Use appConfig instead. This is only left for compatibility with other apps.
 */
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

    const deployConfig = new DeployConfig();

    deployConfig.fetch();

    return deployConfig;
}

angular.module('superdesk.config', ['superdesk.core.api'])
    .factory('deployConfig', DeployConfigFactory)

    .run(['$rootScope', 'deployConfig', function($rootScope) {
        $rootScope.config = appConfig || {};
    }]);
