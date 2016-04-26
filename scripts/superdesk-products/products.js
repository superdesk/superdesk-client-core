(function() {
    'use strict';

    var app = angular.module('superdesk.products', [
        'superdesk.users'
    ]);

    app
        .config(['superdeskProvider', function(superdesk) {
            superdesk
            .activity('/settings/products', {
                    label: gettext('Products'),
                    controller: ProductsConfigController,
                    templateUrl: 'scripts/superdesk-products/views/settings.html',
                    category: superdesk.MENU_SETTINGS,
                    privileges: {products: 1}
                });
        }])
        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('products', {
                type: 'http',
                backend: {
                    rel: 'products'
                }
            });
        }])
        .factory('products', ['$q', 'api', 'contentFilters', '$filter', function($q, api, contentFilters, $filter) {
            var productsService = {
                products: null,
                contentFilters: null,
                productLookup: {},
                fetchProducts: function() {
                    var self = this;

                    return api.products.query({max_results: 500})
                    .then(function(result) {
                        self.products = result;
                        _.each(result._items, function(product) {
                            self.productLookup[product._id] = product;
                        });
                    });
                },
                fetchContentFilters: function() {
                    var self = this;

                    return contentFilters.getAllContentFilters().then(function(filters) {
                        self.contentFilters = $filter('sortByName')(filters);
                    });
                },
                initialize: function() {
                    return this.fetchProducts()
                    .then(angular.bind(this, this.fetchContentFilters));
                }
            };
            return productsService;
        }])
        .directive('sdProductsConfig', function() {
            return {
                controller: ProductsConfigController
            };
        })
        .directive('sdProductsConfigModal', function() {
            return {
                require: '^sdProductsConfig',
                templateUrl: 'scripts/superdesk-products/views/products-config-modal.html',
                link: function(scope, elem, attrs, ctrl) {

                }
            };
        });

    ProductsConfigController.$inject = ['$scope', 'gettext', 'notify', 'api', 'products', 'modal',
    'adminPublishSettingsService', 'metadata', '$filter'];
    function ProductsConfigController ($scope, gettext, notify, api, products, modal,
        adminPublishSettingsService, metadata, $filter) {

        var initProducts = function() {
            products.initialize().then(function() {
                $scope.products = products.products;
                $scope.contentFilters = products.contentFilters;
            });
        };

        var initSubscribers = function() {
            if (!$scope.subscribers) {
                adminPublishSettingsService.fetchSubscribers().then(function(items) {
                    $scope.subscribers = items._items;
                });
            }
        };

        var initRegions = function() {
            if (angular.isDefined(metadata.values.geographical_restrictions)) {
                $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
            } else {
                metadata.fetchMetadataValues().then(function() {
                    $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
                });
            }
        };

        $scope.newProduct = function() {
            $scope.product.edit = {};
            $scope.product.edit.content_filter = {};
            $scope.product.edit.content_filter.filter_type = 'blocking';
            $scope.modalActive = true;
        };

        $scope.edit = function(product) {
            $scope.product = product;
            $scope.product.edit = _.create(product);
            $scope.product.edit.content_filter = _.create(product.content_filter || {});
            $scope.modalActive = true;
        };

        $scope.cancel = function() {
            $scope.modalActive = false;
            $scope.product = {};
            $scope.product.edit = null;
            initProducts();
            initSubscribers();
            initRegions();
        };

        $scope.cancel();

        $scope.save = function() {
            var product = _.omit($scope.product, 'edit');
            api.products.save(product, $scope.product.edit).then(function() {
                notify.success(gettext('Product is saved.'));
            }, function(response) {
                if (angular.isDefined(response.data._issues) &&
                    angular.isDefined(response.data._issues['validator exception'])) {
                    notify.error(gettext('Error: ' + response.data._issues['validator exception']));
                } else if (angular.isDefined(response.data._issues)) {
                    if (response.data._issues.name && response.data._issues.name.unique) {
                        notify.error(gettext('Error: ' + gettext('Name needs to be unique')));
                    } else {
                        notify.error(gettext('Error: ' + JSON.stringify(response.data._issues)));
                    }
                }
            }).then($scope.cancel);
        };

        $scope.remove = function(product) {
            modal.confirm(gettext('Are you sure you want to delete product?')).then(
                function removeProduct() {
                    api.products.remove(product).then(function() {
                        notify.success(gettext('Product deleted.'), 3000);
                    }, function(response) {
                        if (angular.isDefined(response.data._message)) {
                            notify.error(gettext('Error: ' + response.data._message));
                        } else {
                            notify.error(gettext('Error: Failed to delete product.'));
                        }
                    });
                }
            ).then($scope.cancel);
        };
    }

    return app;

})();
