/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import './index.scss';

import 'jquery-ui/jquery-ui';
import 'jquery-jcrop';
import 'jquery-gridster';
import 'moment-timezone';
import 'lodash';
import 'bootstrap';
import 'angular';
import 'angular-moment';
import 'angular-bootstrap-npm';
import 'angular-resource';
import 'angular-route';
import 'angular-gettext';
import 'angular-mocks';
import 'angular-animate';
import 'angular-embedly';
import 'angular-embed';
import 'angular-contenteditable';
import 'angular-vs-repeat';
import 'ng-file-upload';
import 'exif-js';
import 'raven-js';
import 'rangy';
import 'rangy-saverestore';
import 'ment.io';

import 'core/keyboard';
import 'core/auth';
import 'core/datetime';
import 'core/directives';
import 'core/ui';
import 'core/services';
import 'core/superdesk';

import './dist/templates-cache-docs.generated';

var app = angular.module('superdesk.docs', [
    'ngRoute',
    'ngResource',
    'ui.bootstrap',

    'superdesk.core.datetime',
    'superdesk.core.ui',
    'superdesk.core.services.modal',

    'superdesk.core.keyboard',
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
]);

MainDocsView.$inject = ['$location', '$anchorScroll', 'asset'];
function MainDocsView($location, $anchorScroll) {
    return {
        templateUrl: 'main.html',
        link: function(scope, elem, attrs) {
            scope.scrollTo = function(id) {
                $location.hash(id);
                $anchorScroll();
            };

            //Modals
            scope.modalActive = false;

            scope.openModal = function() {
                scope.modalActive = true;
            };

            scope.closeModal = function() {
                scope.modalActive = false;
            };

            //Select boxes
            scope.opts = ['Serbia', 'Czech Republic', 'Germany', 'Australia'];

            //Typeahead
            scope.taTerms = ['Serbia', 'Czech Republic', 'Germany', 'Australia', 'Canada', 'Russia', 'Italy', 'Egypt', 'China'];
            scope.taSelected = null;
            scope.taItems = [];

            scope.taSearch = function(term) {
                scope.taItems = _.filter(scope.taTerms, function(t) {
                    return t.toLowerCase().indexOf(term.toLowerCase()) !== -1;
                });
                return scope.taItems;
            };

            scope.taSelect = function(term) {
                scope.taSelected = term;
            };

            //datepicker
            scope.dateNow = moment().utc().format();

            //timepicker
            scope.timeNow = moment().utc().format('HH:mm:ss');
        }
    };
}

app.directive('sdDocs', MainDocsView);
app.directive('prettyprint', function() {
    return {
        restrict: 'C',
        link: function postLink(scope, element, attrs) {

            //remove leading whitespaces
            var str = element[0].innerHTML;
            var pos = 0; var sum = 0;
            while (str.charCodeAt(pos) === 32) {
                sum = sum + 1;
                pos = pos + 1;
            }
            var pattern = '\\s{' + sum + '}';
            var spaces = new RegExp(pattern, 'g');
            element[0].innerHTML = str.replace(spaces, '\n');

            //remove ng-non-bindable from code
            element.find('[ng-non-bindable=""]').each(function(i, val) {
                $(val).removeAttr('ng-non-bindable');
            });

            var langExtension = attrs['class'].match(/\blang(?:uage)?-([\w.]+)(?!\S)/);
            if (langExtension) {
                langExtension = langExtension[1];
            }
            element.html(window.prettyPrintOne(_.escape(element.html()), langExtension, true));
        }

    };
});

/* globals __SUPERDESK_CONFIG__: true */
angular.module('superdesk.config').constant('config', __SUPERDESK_CONFIG__);

var body = angular.element('body');
body.ready(function () {
    angular.bootstrap(body, [
        'superdesk.docs',
        'superdesk.templates-cache',
        'superdesk.config'
    ]);
});

export default app;
