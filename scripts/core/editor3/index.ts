import './styles.scss';

import {EditorService} from './service';
import {sdEditor3} from './directive';
/**
 * @ngdoc module
 * @module superdesk.core.editor3
 * @name superdesk.core.editor3
 * @packageName superdesk.core
 * @description Editor as an Angular directive.
 */
export default angular.module('superdesk.core.editor3', ['superdesk.apps.spellcheck'])
    .service('editor3', EditorService)
    .service('editorResolver', ['editor3', function(editor3) {
        this.get = function() {
            return editor3;
        };
    }])
    .directive('sdEditor3', sdEditor3);
