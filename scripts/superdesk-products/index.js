// styles
import './styles/products.less';

import { ProductsFactory } from './services';
import { ProductsConfigController } from './controllers';

export default angular.module('superdesk.products', ['superdesk.users'])
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
        apiProvider.api('products', {type: 'http', backend: {rel: 'products'}});
    }])

    .controller('ProductsConfigCtrl', ProductsConfigController)

    .factory('products', ProductsFactory)

    .directive('sdProductsConfig', () => ({controller: ProductsConfigController}))
    .directive('sdProductsConfigModal', () => ({
        templateUrl: 'scripts/superdesk-products/views/products-config-modal.html'
    }));
