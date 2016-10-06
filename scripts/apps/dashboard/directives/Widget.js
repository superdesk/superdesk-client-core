import { ConfigController } from 'apps/dashboard/controllers';

Widget.$inject = ['$modal', 'asset'];

/**
 * sdWidget give appropriate template to data assgined to it
 *
 * Usage:
 * <div sd-widget data-widget="widget"></div>
 *
 * Params:
 * @scope {Object} widget
 */
export function Widget($modal, asset) {
    return {
        templateUrl: asset.templateUrl('apps/dashboard/views/widget.html'),
        restrict: 'A',
        replace: true,
        transclude: true,
        scope: {widget: '=', save: '&', configurable: '='},
        link: function(scope, element, attrs) {
            scope.openConfiguration = function () {
                $modal.open({
                    templateUrl: 'scripts/apps/dashboard/views/configuration.html',
                    controller: ConfigController,
                    scope: scope
                });
            };
        }
    };
}
