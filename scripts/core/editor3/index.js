import './styles.scss';

import {EditorService} from './service';
import {sdEditor3} from './directive';

/**
 * @ngdoc module
 * @module superdesk.core.editor3
 * @name superdesk.core.editor3
 * @packageName superdesk.core
 * @description Superdesk core editor version 3.
 */
export default angular.module('superdesk.core.editor3', ['superdesk.apps.spellcheck'])
    .service('editor3', EditorService)
    .directive('sdEditor3', sdEditor3);
