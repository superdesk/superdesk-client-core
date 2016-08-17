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
    .controller('ProductsConfigCtrl', ProductsConfigController)
    .factory('products', ['$q', 'api', 'contentFilters', '$filter',
        function($q, api, contentFilters, $filter) {
            /**
             * Recursivly returns all products
             *
             * @return {*}
             */
            var _getAllProducts = function(page, products) {
                page = page || 1;
                products = products || [];

                return api('products')
                .query({max_results: 200, page: page})
                .then(function(result) {
                    products = products.concat(result._items);
                    if (result._links.next) {
                        page++;
                        return _getAllProducts(page, products);
                    }
                    return $filter('sortByName')(products);
                });
            };

            var productsService = {
                products: null,
                contentFilters: null,
                productLookup: {},
                fetchProducts: function() {
                    var self = this;

                    return _getAllProducts()
                    .then(function(result) {
                        self.products = result;
                        _.each(result._items, function(product) {
                            self.productLookup[product._id] = product;
                        });
                    });
                },
                fetchAllProducts: function() {
                    return _getAllProducts();
                },
                fetchContentFilters: function() {
                    var self = this;

                    return contentFilters.getAllContentFilters().then(function(filters) {
                        self.contentFilters = $filter('sortByName')(filters);
                    });
                },
                testProducts: function(diff) {
                    return api.save('product_tests', {}, diff);
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
            templateUrl: 'scripts/superdesk-products/views/products-config-modal.html',
            link: function(scope, elem, attrs, ctrl) {

            }
        };
    });

ProductsConfigController.$inject = ['$scope', 'gettext', 'notify', 'api', 'products', 'modal',
'subscribersService', 'metadata', '$filter'];
function ProductsConfigController ($scope, gettext, notify, api, products, modal,
    subscribersService, metadata, $filter) {

    $scope.testLookup = {};
    $scope.productLookup = {};
    $scope.loading = false;
    $scope.resultType = 'All';

    var initProducts = function() {
        products.initialize().then(function() {
            $scope.products = products.products;
            $scope.contentFilters = products.contentFilters;
            _.each(products.products, function(product) {
                $scope.productLookup[product._id] = product;
            });
        });
    };

    var initSubscribers = function() {
        if (!$scope.subscribers) {
            subscribersService.fetchSubscribers().then(function(items) {
                $scope.subscribers = items;
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
        $scope.product.edit.content_filter.filter_type = 'permitting';
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

    $scope.test = function() {
        if (!$scope.articleId) {
            notify.error(gettext('Please provide an article id'));
            return;
        }

        $scope.loading = true;
        products.testProducts({'article_id': $scope.articleId}).then(function(results) {
            $scope.rawResults = results;
            $scope.filteredProducts = [];

            if ($scope.resultType === 'All') {
                $scope.filteredProducts = $scope.products;
            }
            _.each(results._id, function(result) {

                $scope.testLookup[result.product_id] = result;

                if ((result.matched && $scope.resultType === 'Match') ||
                (!result.matched && $scope.resultType === 'No-Match')) {
                    $scope.filteredProducts.push($scope.productLookup[result.product_id]);
                }
            });
        }, function(response) {
            notify.error(gettext('Error: ' + JSON.stringify(response)));
        }).finally(function() {
            $scope.loading = false;
        });
    };
}

export default app;
