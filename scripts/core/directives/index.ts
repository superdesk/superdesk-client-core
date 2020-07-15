import './AutofocusDirective';
import './SortDirective';
import './PasswordStrengthDirective';
import './SearchListDirective';
import './FiletypeIconDirective';
import './CheckAllDirective';
import './SwitchInvertedDirective';
import './SelectDirective';
import './SelectPopupDirective';
import './PermissionsDirective';
import './SortableDirective';
import './DroppableDirective';
import './DraggableDirective';
import './TypeaheadDirective';
import './SliderDirective';
import './WithParamsDirective';

import {PhoneHomeModalDirective} from './PhoneHomeModalDirective';
import {reactToAngular1} from 'superdesk-ui-framework';
import {UserAvatar} from 'apps/users/components/UserAvatar';
import {UserOrganisationAvatar} from 'apps/users/components/OrganisationAvatar';

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
    'superdesk.core.directives.sort',
    'superdesk.core.directives.passwordStrength',
    'superdesk.core.directives.searchList',
    'superdesk.core.directives.filetypeIcon',
    'superdesk.core.directives.checkAll',
    'superdesk.core.directives.switchInverted',
    'superdesk.core.directives.select',
    'superdesk.core.directives.selectPopup',
    'superdesk.core.directives.permissions',
    'superdesk.core.directives.sortable',
    'superdesk.core.directives.draggable',
    'superdesk.core.directives.droppable',
    'superdesk.core.directives.typeahead',
    'superdesk.core.directives.slider',
    'superdesk.core.directives.withParams',
])

    .directive('sdPhoneHomeModal', PhoneHomeModalDirective)
    .component(
        'sdUserAvatar',
        reactToAngular1(UserAvatar, ['user', 'size', 'displayStatus', 'displayAdministratorIndicator']),
    )
    .component(
        'sdOrganisationAvatar',
        reactToAngular1(UserOrganisationAvatar, ['size']),
    )
;
