// styles
import './styles/products.scss';
import {ProductsFilter} from './filters';
import {ProductsFactory} from './services';
import {ProductsConfigController} from './controllers';

/**
 * @ngdoc module
 * @module superdesk.apps.products
 * @name superdesk.apps.products
 * @packageName superdesk.apps
 * @description Adds products support to Superdesk.
 */
export default angular.module('superdesk.apps.products', ['superdesk.apps.users'])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/products', {
                label: gettext('Products'),
                controller: ProductsConfigController,
                templateUrl: 'scripts/apps/products/views/settings.html',
                category: superdesk.MENU_SETTINGS,
                privileges: {products: 1},
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('products', {type: 'http', backend: {rel: 'products'}});
    }])
    .filter('productsBy', ProductsFilter)
    .controller('ProductsConfigCtrl', ProductsConfigController)

    .factory('products', ProductsFactory)

    .directive('sdProductsConfigModal', () => ({
        templateUrl: 'scripts/apps/products/views/products-config-modal.html',
    }));
