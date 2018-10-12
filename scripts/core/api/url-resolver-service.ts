
URLResolver.$inject = ['$http', '$q', '$log', 'config'];
function URLResolver($http, $q, $log, config) {
    var _links, baseUrl = config.server.url;

    function basejoin(path) {
        return baseUrl + (path.indexOf('/') === 0 ? path : '/' + path);
    }

    /**
     * Get url for given resource
     *
     * @param {String} resource
     * @returns Promise
     */
    this.resource = function(resource) {
        return this.links().then(() => {
            if (_links[resource]) {
                return _links[resource];
            }

            $log.warn('resource url not found', resource);
            return $q.reject({status: 404, resource: resource});
        });
    };

    /**
     * Get server url for given item
     *
     * @param {String} item
     * @returns {String}
     */
    this.item = function(item) {
        return basejoin(item);
    };

    /**
     * Get resource links
     */
    this.links = function() {
        if (_links) {
            return $q.when(_links);
        }

        return fetchResourceLinks();
    };

    /**
     * Get url for media field
     *
     * @param {Object} media
     * @param {String} resource
     * @return {String}
     */
    this.media = function(media, resource) {
        const url = basejoin('upload-raw/' + media._id);

        return resource ? url + '?resource=' + resource : url;
    };

    /**
     * Fetch resource links via root url
     *
     * @returns {Promise}
     */
    function fetchResourceLinks() {
        if (!baseUrl) {
            return $q.reject();
        }

        return $http({
            method: 'GET',
            url: baseUrl,
            cache: true,
        }).then((response) => {
            _links = {};

            if (response.status === 200) {
                _.each(response.data._links.child, (link) => {
                    _links[link.title] = basejoin(link.href);
                });
            } else {
                $q.reject(response);
            }

            return _links;
        });
    }
}

angular.module('superdesk.core.api.urls', [])
    .service('urls', URLResolver);
