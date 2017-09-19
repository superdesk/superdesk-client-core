/**
 * @ngdoc controller
 * @module superdesk.apps.products
 * @name ProductsConfigCtrl
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires gettext
 * @requires notify
 * @requires api
 * @requires products
 * @requires modal
 * @requires subscribersService
 * @requires metadata
 * @requires $filter
 * @description ProductsConfigController holds a set of convenience functions for product maintenance.
 */
ProductsConfigController.$inject = ['$scope', 'gettext', 'notify', 'api', 'products', 'modal',
    'subscribersService', 'metadata', '$filter'];
export function ProductsConfigController($scope, gettext, notify, api, products, modal,
    subscribersService, metadata, $filter) {
    $scope.testLookup = {};
    $scope.productLookup = {};
    $scope.loading = false;
    $scope.resultType = 'All';
    $scope.products = [];

    /**
     * @ngdoc method
     * @private
     * @name ProductsConfigCtrl#initProducts
     * @description Initialize products and products lookup.
     */
    const initProducts = function() {
        products.initialize().then(() => {
            $scope.products = products.products;
            $scope.contentFilters = products.contentFilters;
            _.each(products.products, (product) => {
                $scope.productLookup[product._id] = product;
            });
        });
    };

    /**
     * @ngdoc method
     * @private
     * @name ProductsConfigCtrl#initSubscribers
     * @description Initialize subscribers.
     */
    const initSubscribers = function() {
        if (!$scope.subscribers) {
            subscribersService.fetchSubscribers().then((items) => {
                $scope.subscribers = items;
            });
        }
    };

    /**
     * @ngdoc method
     * @private
     * @name ProductsConfigCtrl#initRegions
     * @description Initialize regions.
     */
    const initRegions = function() {
        if (angular.isDefined(metadata.values.geographical_restrictions)) {
            $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
        } else {
            metadata.fetchMetadataValues().then(() => {
                $scope.geoRestrictions = $filter('sortByName')(metadata.values.geographical_restrictions);
            });
        }
    };

    /**
     * @ngdoc method
     * @private
     * @name ProductsConfigCtrl#initProductTypes
     * @description Initialize product types.
     */
    const initProductTypes = function() {
        if (angular.isDefined(metadata.values.product_types)) {
            $scope.product_types = $filter('sortByName')(metadata.values.product_types);
        } else {
            metadata.fetchMetadataValues().then(() => {
                $scope.product_types = $filter('sortByName')(metadata.values.product_types);
            });
        }
    };

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#newProduct
     * @public
     * @description Initialize the modal to create new product.
     */
    $scope.newProduct = function() {
        $scope.product.edit = {};
        $scope.product.edit.content_filter = {};
        $scope.product.edit.content_filter.filter_type = 'permitting';
        $scope.modalActive = true;
    };

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#edit
     * @public
     * @description Edit a product.
     * @param {Object} product The product to be edited.
     */
    $scope.edit = function(product) {
        $scope.product = product;
        $scope.product.edit = _.create(product);
        $scope.product.edit.content_filter = _.create(product.content_filter || {});
        $scope.modalActive = true;
    };

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#cancel
     * @public
     * @description Close the modal and refresh products
     */
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

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#save
     * @public
     * @description Save the product.
     */
    $scope.save = function() {
        var product = _.omit($scope.product, 'edit');

        api.products.save(product, $scope.product.edit).then(() => {
            notify.success(gettext('Product is saved.'));
            $scope.cancel();
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
        });
    };

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#remove
     * @public
     * @description Delete the product
     * @param {Object} product The product to be removed.
     */
    $scope.remove = function(product) {
        modal.confirm(gettext('Are you sure you want to delete product?')).then(() => {
            let remove = api.products.remove(product).then(() => {
                notify.success(gettext('Product deleted.'));
            }, (response) => {
                if (angular.isDefined(response.data._message)) {
                    notify.error(gettext('Error: ' + response.data._message));
                } else {
                    notify.error(gettext('Error: Failed to delete product.'));
                }
            });

            return remove;
        })
            .then($scope.cancel);
    };

    /**
     * @ngdoc method
     * @name ProductsConfigCtrl#test
     * @public
     * @description Test a given item is valid for product or not.
     */
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
            _.each(results._items, (result) => {
                $scope.testLookup[result.product_id] = result;

                if (result.matched && $scope.resultType === 'Match' ||
                !result.matched && $scope.resultType === 'No-Match') {
                    $scope.filteredProducts.push($scope.productLookup[result.product_id]);
                }
            });
        }, (response) => {
            let msg = response.data && response.data._message ? response.data._message : JSON.stringify(response);

            notify.error(gettext('Error: ' + msg));
        })
            .finally(() => {
                $scope.loading = false;
            });
    };
}
