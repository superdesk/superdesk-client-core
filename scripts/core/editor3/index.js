import './styles.scss';

import {EditorService} from './service';
import {sdEditor3} from './directive';
import ng from 'core/services/ng';

/**
 * @ngdoc module
 * @module superdesk.core.editor3
 * @name superdesk.core.editor3
 * @packageName superdesk.core
 * @description Editor as an Angular directive.
 */
export default angular.module('superdesk.core.editor3', ['superdesk.apps.spellcheck'])
    .service('editor3', EditorService)
    .service('editorResolver', ['editor', 'editor3', 'config', function(editor2, editor3, config) {
        // Enables the use of editor2 and editor3 in parallel.
        // Resolves to old editor in case editor3 is inactive.
        this.get = function() {
            const authoring = ng.get('authoring');
            const editor3Active = authoring.editor && authoring.editor.body_html && authoring.editor.body_html.editor3;

            return config.features.onlyEditor3 || editor3Active ? editor3 : editor2;
        };
    }])
    .directive('sdEditor3', sdEditor3);

// Editor as a React Component.
export {Editor} from './react';
export {toHTML, fromHTML} from './html';
