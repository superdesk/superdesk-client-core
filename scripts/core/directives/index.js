import './AutofocusDirective';
import './DebounceThrottleDirective';
import './SortDirective';
import './PasswordStrengthDirective';
import './SearchListDirective';
import './FiletypeIconDirective';
import './CheckDirective';
import './ConfirmDirective';
import './SelectDirective';
import './PermissionsDirective';
import './DragDropDirective';
import './TypeaheadDirective';
import './SliderDirective';
import './UserAvatarDirective';
import './WithParamsDirective';

/**
 * @ngdoc module
 * @module superdesk.core.directives
 * @name superdesk.core.directives
 * @packageName superdesk.core
 * @description Superdesk core directives collection.
 */
export default angular.module('superdesk.core.directives', [
    'superdesk.core.directives.autofocus',
    'superdesk.core.directives.throttle',
    'superdesk.core.directives.sort',
    'superdesk.core.directives.passwordStrength',
    'superdesk.core.directives.searchList',
    'superdesk.core.directives.filetypeIcon',
    'superdesk.core.directives.check',
    'superdesk.core.directives.confirm',
    'superdesk.core.directives.select',
    'superdesk.core.directives.permissions',
    'superdesk.core.directives.dragdrop',
    'superdesk.core.directives.typeahead',
    'superdesk.core.directives.slider',
    'superdesk.core.directives.avatar',
    'superdesk.core.directives.withParams'
]);
