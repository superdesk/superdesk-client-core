ProductsFactory.$inject = ['$q', 'api', 'contentFilters', '$filter'];
export function ProductsFactory($q, api, contentFilters, $filter) {
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
}
