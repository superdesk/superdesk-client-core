/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import './index.less';

import 'bower_components/jquery/dist/jquery.js';
import 'bower_components/lodash/lodash.js';
import 'bower_components/jquery-ui/jquery-ui.js';
import 'bower_components/bootstrap/dist/js/bootstrap.js';
import 'bower_components/react/react.js';
import 'bower_components/react/react-dom.js';
import 'bower_components/classnames/index.js';
import 'bower_components/angular/angular.js';
import 'bower_components/gridster/dist/jquery.gridster.with-extras.js';
import 'bower_components/medium-editor/dist/js/medium-editor.js';
import 'bower_components/ment.io/dist/mentio.js';
import 'bower_components/rangy/rangy-core.js';
import 'bower_components/rangy/rangy-selectionsaverestore.js';
import 'bower_components/momentjs/moment.js';
import 'bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.js';
import 'bower_components/langmap/language-mapping-list.js';
import 'bower_components/angular-moment/angular-moment.js';
import 'bower_components/d3/d3.js';
import 'bower_components/jcrop/js/jquery.Jcrop.js';
import 'bower_components/angular-bootstrap/ui-bootstrap-tpls.js';
import 'bower_components/angular-resource/angular-resource.js';
import 'bower_components/angular-route/angular-route.js';
import 'bower_components/angular-gettext/dist/angular-gettext.js';
import 'bower_components/angular-mocks/angular-mocks.js';
import 'bower_components/angular-animate/angular-animate.js';
import 'bower_components/ng-file-upload/ng-file-upload.js';
import 'bower_components/ng-file-upload/ng-file-upload-shim.js';
import 'bower_components/raven-js/dist/raven.js';
import 'bower_components/angular-embed/dist/angular-embed.js';
import 'bower_components/angular-contenteditable/angular-contenteditable.js';
import 'bower_components/angular-vs-repeat/src/angular-vs-repeat.js';
import 'bower_components/exif-js/exif.js';

import 'superdesk/keyboard';
import 'superdesk/auth';
import 'superdesk/datetime';
import 'superdesk/directives';
import 'superdesk/ui';
import 'superdesk/services';
import 'superdesk/superdesk-docs';
import 'superdesk/superdesk';

(function() {

    'use strict';

    var app = angular.module('superdesk.docs', []);

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

    return app;

})();
