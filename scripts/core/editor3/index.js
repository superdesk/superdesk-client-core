/**
 * @ngdoc module
 * @module superdesk.core.editor3
 * @name superdesk.core.editor3
 * @packageName superdesk.core
 * @description Superdesk core editor version 3.
 */
import './styles.scss';
import * as ctrl from './controllers';

/**
 * @ngdoc directive
 * @module superdesk.core.editor3
 * @name sdEditor3
 * @param {Array} editorFormat the formating settings available for editor
 * @param {String} value the model for editor value
 * @param {Boolean} readOnly true if the editor is read only
 * @param {Function} onChange the callback executed when the editor value is changed
 * @param {String} language the current language used for spellchecker
 * @description sdEditor3 integrates react Editor3 component with superdesk app.
 */
export default angular.module('superdesk.core.editor3', ['superdesk.apps.spellcheck'])
    .directive('sdEditor3',
        () => ({
            scope: {},
            bindToController: {
                config: '=',
                editorFormat: '=',
                language: '=',
                onChange: '&',
                value: '=',
                readOnly: '=',
                trim: '='
            },
            controllerAs: 'vm',
            controller: ctrl.Editor3Controller
        })
    );
