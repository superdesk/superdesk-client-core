import './AutofocusDirective';
import './ThrottleDirective';
import './DebounceDirective';
import './SortDirective';
import './PasswordStrengthDirective';
import './SearchListDirective';
import './SearchListSingleDirective';
import './FiletypeIconDirective';
import './CheckAllDirective';
import './SwitchInvertedDirective';
import './ConfirmDirective';
import './SelectDirective';
import './SelectPopupDirective';
import './PermissionsDirective';
import './SortableDirective';
import './DroppableDirective';
import './DraggableDirective';
import './TypeaheadDirective';
import './SliderDirective';
import './UserAvatarDirective';
import './WithParamsDirective';

import {PhoneHomeModalDirective} from './PhoneHomeModalDirective';

/**
 * @ngdoc module
 * @module superdesk.core.directives
 * @name superdesk.core.directives
 * @packageName superdesk.core
 * @description Superdesk core directives collection. Contains a set of modules
 *  that implement various UI components and helpers.
 */
export default angular.module('superdesk.core.directives', [
    'superdesk.core.directives.autofocus',
    'superdesk.core.directives.debounce',
    'superdesk.core.directives.throttle',
    'superdesk.core.directives.sort',
    'superdesk.core.directives.passwordStrength',
    'superdesk.core.directives.searchList',
    'superdesk.core.directives.searchListSingle',
    'superdesk.core.directives.filetypeIcon',
    'superdesk.core.directives.checkAll',
    'superdesk.core.directives.switchInverted',
    'superdesk.core.directives.confirm',
    'superdesk.core.directives.select',
    'superdesk.core.directives.selectPopup',
    'superdesk.core.directives.permissions',
    'superdesk.core.directives.sortable',
    'superdesk.core.directives.draggable',
    'superdesk.core.directives.droppable',
    'superdesk.core.directives.typeahead',
    'superdesk.core.directives.slider',
    'superdesk.core.directives.avatar',
    'superdesk.core.directives.withParams'
])

.directive('sdPhoneHomeModal', PhoneHomeModalDirective)
;
