import _ from 'lodash';

ProductsFactory.$inject = ['$q', 'api', 'contentFilters', '$filter'];
export function ProductsFactory($q, api, contentFilters, $filter) {
    /**
     * Recursivly returns all products
     *
     * @return {*}
     */
    var _getAllProducts = function(page = 1, products = []) {
        return api('products')
            .query({max_results: 200, page: page})
            .then((result) => {
                let pg = page;
                let merged = products.concat(result._items);

                if (result._links.next) {
                    pg++;
                    return _getAllProducts(pg, merged);
                }

                return $filter('sortByName')(merged);
            });
    };

    var productsService = {
        products: null,
        contentFilters: null,
        productLookup: {},
        fetchProducts: function() {
            var self = this;

            return _getAllProducts()
                .then((result) => {
                    self.products = result;
                    _.each(result._items, (product) => {
                        self.productLookup[product._id] = product;
                    });
                });
        },
        fetchAllProducts: function() {
            return _getAllProducts();
        },
        fetchContentFilters: function() {
            var self = this;

            return contentFilters.getAllContentFilters().then((filters) => {
                self.contentFilters = $filter('sortByName')(filters);
            });
        },
        testProducts: function(diff) {
            return api.save('product_tests', {}, diff);
        },
        initialize: function() {
            return this.fetchProducts()
                .then(angular.bind(this, this.fetchContentFilters));
        },
    };

    return productsService;
}
