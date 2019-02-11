/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import './styles/packaging.scss';

import * as ctrl from './controllers';
import * as directive from './directives';
import {PackagesService} from './services';
import {gettext} from 'core/utils';

/**
 * @ngdoc module
 * @module superdesk.apps.packaging
 * @name superdesk.apps.packaging
 * @packageName superdesk.apps
 * @description This module adds support for packages.
 */
angular.module('superdesk.apps.packaging', [
    'superdesk.core.api',
    'superdesk.core.activity',
    'superdesk.apps.authoring',
])
    .service('packages', PackagesService)

    .directive('sdPackageEdit', directive.PackageEdit)
    .directive('sdPackageItemsEdit', directive.PackageItemsEdit)
    .directive('sdSortPackageItems', directive.SortPackageItems)
    .directive('sdPackage', directive.Package)
    .directive('sdPackageItem', directive.PackageItem)
    .directive('sdPackageItemProxy', directive.PackageItemProxy)
    .directive('sdPackageRef', directive.PackageRef)
    .directive('sdPackageItemPreview', directive.PackageItemPreview)
    .directive('sdWidgetPreventPreview', directive.PreventPreview)
    .directive('sdAddPackageDropdown', directive.AddPackageDropdown)

    .controller('SearchWidgetCtrl', ctrl.SearchWidgetCtrl)

    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('create.package', {
                label: gettext('Create package'),
                controller: ctrl.CreatePackageCtrl,
                filters: [{action: 'create', type: 'package'}],
                condition: function(item) {
                    return item ? (item.state !== 'killed' && item.state !== 'recalled') : true;
                },
            })

            .activity('packageitem', {
                label: gettext('Create package'),
                priority: 50,
                icon: 'package-create',
                keyboardShortcut: 'ctrl+alt+p',
                controller: ctrl.PackageItemCtrl,
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', '$rootScope', function(authoring, item, $rootScope) {
                    return authoring.itemActions(item).package_item &&
                        !($rootScope.config && $rootScope.config.features
                        && $rootScope.config.features.hideCreatePackage);
                }],
                group: 'packaging',
            })

            .activity('addtopackage', {
                label: gettext('Add to current'),
                priority: 5,
                dropdown: directive.AddToPackageDropdown,
                icon: 'package-plus',
                templateUrl: 'scripts/apps/packaging/views/add-to-package.html',
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoringWorkspace', 'item', 'authoring', 'packages',
                    function(authoringWorkspace, item, authoring, packages) {
                        var pkg = authoringWorkspace.getItem();
                        var actions = authoring.itemActions(item);
                        var added = pkg ? packages.isAdded(pkg, item) : false;

                        return pkg && pkg.type === 'composite' && pkg._id !== item._id
                            && actions.add_to_current && !added;
                    }],
                group: 'packaging',
            })

            .activity('combineinpackage', {
                label: gettext('Combine with current'),
                priority: 49,
                icon: 'package-plus',
                controller: ctrl.CombinePackageCtrl,
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoringWorkspace', 'item', 'authoring',
                    function(authoringWorkspace, item, authoring) {
                        var openItem = authoringWorkspace.getItem();
                        var actions = authoring.itemActions(item);

                        return openItem && openItem.type !== 'composite' && openItem._id !== item._id &&
                            actions.add_to_current;
                    }],
                group: 'packaging',
            })

            .activity('movepackage', {
                label: gettext('Send package to'),
                icon: 'share-alt',
                controller: ['data', 'send', (data, send) => {
                    send.allAs([data.item], 'send_to');
                }],
                filters: [{action: 'list', type: 'archive'}],
                additionalCondition: ['authoring', 'item', 'config', (authoring, item, config) =>
                    authoring.itemActions(item).send && item.type === 'composite',
                ],
                group: 'packaging',
            });
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('archive', {type: 'http', backend: {rel: 'archive'}});
    }])

    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('archived', {type: 'http', backend: {rel: 'archived'}});
    }]);
