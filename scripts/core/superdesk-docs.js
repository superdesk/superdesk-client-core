/**
* This file is part of Superdesk.
*
* Copyright 2013, 2014 Sourcefabric z.u. and contributors.
*
* For the full copyright and license information, please see the
* AUTHORS and LICENSE files distributed with this source code, or
* at https://www.sourcefabric.org/superdesk/license
*/
var modules = [
    'ngRoute',
    'ngResource',
    'ui.bootstrap',

    'superdesk.core.datetime',
    'superdesk.core.ui',
    'superdesk.core.services.modal',

    'superdesk.keyboard',
    'superdesk.core.directives.autofocus',
    'superdesk.core.directives.throttle',
    'superdesk.core.directives.sort',
    'superdesk.core.links',
    'superdesk.core.directives.check',
    'superdesk.core.directives.confirm',
    'superdesk.core.directives.select',
    'superdesk.core.directives.permissions',
    'superdesk.core.avatar',
    'superdesk.core.directives.dragdrop',
    'superdesk.core.directives.typeahead',
    'superdesk.core.directives.slider',
    'superdesk.core.directives.searchList'
];

export default angular.module('superdesk.docs.core', modules);
