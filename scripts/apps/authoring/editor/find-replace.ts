/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/apps/license
 */

import {gettext} from 'core/utils';

FindReplaceDirective.$inject = ['editorResolver', 'macros'];
/**
 * using directive here so that it can return focus
 */
function FindReplaceDirective(editorResolver, macros) {
    return {
        link: function(scope, elem) {
            const editor = editorResolver.get();

            scope.to = '';
            scope.from = '';
            scope.caseSensitive = true;

            // stop macros find/replace
            macros.diff = null;

            /**
             * Highlight next matching string
             */
            scope.next = function() {
                editor.selectNext();
            };

            /**
             * Highlight previous matching string
             */
            scope.prev = function() {
                editor.selectPrev();
            };

            /**
             * Replace currently highlighted matching string with text
             */
            scope.replace = function() {
                editor.replace(scope.to || '');
                editor.selectNext();
            };

            /**
             * Replace all matching string with text
             */
            scope.replaceAll = function() {
                editor.replaceAll(scope.to || '');
            };

            scope.$watch('from', (needle) => {
                var input: any = document.getElementById('find-replace-what');
                var selectionStart = input.selectionStart;
                var selectionEnd = input.selectionEnd;

                editor.setSettings({findreplace: {diff: getDiff(), caseSensitive: scope.caseSensitive}});
                editor.render();
                editor.selectNext();
                input.setSelectionRange(selectionStart, selectionEnd);
            });

            function getDiff() {
                var diff = {};

                diff[scope.from || ''] = scope.to || '';
                return diff;
            }

            scope.$watch('caseSensitive', (caseSensitive) => {
                editor.setSettings({findreplace: {diff: getDiff(), caseSensitive: caseSensitive}});
                editor.render();
            });

            scope.$on('$destroy', () => {
                editor.setSettings({findreplace: null});
                editor.render();
            });
        },
    };
}

angular.module('superdesk.apps.authoring.find-replace', ['superdesk.apps.authoring.widgets'])
    .directive('sdFindReplace', FindReplaceDirective)
    .config(['authoringWidgetsProvider', function(authoringWidgetsProvider) {
        authoringWidgetsProvider
            .widget('find-replace', {
                icon: 'find-replace',
                label: gettext('Find and Replace'),
                template: 'scripts/apps/authoring/editor/views/find-replace.html',
                order: 2,
                side: 'right',
                needEditable: true,
                needUnlock: true,
                display: {
                    authoring: true,
                    packages: false,
                    killedItem: false,
                    legalArchive: false,
                    archived: false,
                    picture: true,
                    personal: true,
                },
            });
    }]);
