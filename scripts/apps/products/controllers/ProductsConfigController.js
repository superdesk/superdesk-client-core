ProductsConfigController.$inject = ['$scope', 'gettext', 'notify', 'api', 'products', 'modal',
    'subscribersService', 'metadata', '$filter'];
export function ProductsConfigController($scope, gettext, notify, api, products, modal,
    subscribersService, metadata, $filter) {
    $scope.testLookup = {};
    $scope.productLookup = {};
    $scope.loading = false;
    $scope.resultType = 'All';
    $scope.products = [];

    var initProducts = function() {
        products.initialize().then(() => {
            $scope.products = products.products;
            $scope.contentFilters = products.contentFilters;
            _.each(products.products, (product) => {
                $scope.productLookup[product._id] = product;
            });
        });
    };

    var initSubscribers = function() {
        if (!$scope.subscribers) {
            subscribersService.fetchSubscribers().then((items) => {
                $scope.subscribers = items;
            });
        }
    };

    var initRegions = function() {
        if (angular.isDefined(metadata.values.geographical_restrictions)) {
            $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
        } else {
            metadata.fetchMetadataValues().then(() => {
                $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
            });
        }
    };

    var initProductTypes = function() {
        if (angular.isDefined(metadata.values.product_types)) {
            $scope.product_types = $filter('sortByName')(metadata.values.product_types);
        } else {
            metadata.fetchMetadataValues().then(() => {
                $scope.product_types = $filter('sortByName')(metadata.values.product_types);
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
        initProductTypes();
    };

    $scope.cancel();

    $scope.save = function() {
        var product = _.omit($scope.product, 'edit');

        api.products.save(product, $scope.product.edit).then(() => {
            notify.success(gettext('Product is saved.'));
        }, (response) => {
            if (angular.isDefined(response.data._issues) &&
                angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' + response.data._issues['validator exception']));
            } else if (angular.isDefined(response.data._issues)) {
                if (response.data._issues.name && response.data._issues.name.unique) {
                    notify.error(gettext('Error: ' + gettext('Name needs to be unique')));
                } else if (response.data._issues.product_type) {
                    notify.error(gettext('Error: ' + gettext('Product Type is required')));
                } else {
                    notify.error(gettext('Error: ' + JSON.stringify(response.data._issues)));
                }
            }
        })
        .then($scope.cancel);
    };

    $scope.remove = function(product) {
        modal.confirm(gettext('Are you sure you want to delete product?')).then(
            function removeProduct() {
                api.products.remove(product).then(() => {
                    notify.success(gettext('Product deleted.'), 3000);
                }, (response) => {
                    if (angular.isDefined(response.data._message)) {
                        notify.error(gettext('Error: ' + response.data._message));
                    } else {
                        notify.error(gettext('Error: Failed to delete product.'));
                    }
                });
            }
        )
        .then($scope.cancel);
    };

    $scope.test = function() {
        if (!$scope.articleId) {
            notify.error(gettext('Please provide an article id'));
            return;
        }

        $scope.loading = true;
        products.testProducts({article_id: $scope.articleId}).then((results) => {
            $scope.rawResults = results;
            $scope.filteredProducts = [];

            if ($scope.resultType === 'All') {
                $scope.filteredProducts = $scope.products;
            }
            _.each(results._id, (result) => {
                $scope.testLookup[result.product_id] = result;

                if (result.matched && $scope.resultType === 'Match' ||
                !result.matched && $scope.resultType === 'No-Match') {
                    $scope.filteredProducts.push($scope.productLookup[result.product_id]);
                }
            });
        }, (response) => {
            var msg = response.data && response.data._message ? response.data._message : JSON.stringify(response);

            notify.error(gettext('Error: ' + msg));
        })
        .finally(() => {
            $scope.loading = false;
        });
    };
}
