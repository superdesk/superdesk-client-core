import {formFieldRelations} from './form-field-relations';
import {switchSemantics, invertedSwitchSemantics, checkSemantics} from './toggles';
import {decorativeIcon, tooltipName} from './icons';

/**
 * Adds names, roles and states to shared Angular markup patterns that only convey them visually.
 */
angular.module('superdesk.core.ui.semantics', [])
    .directive('sdLineInput', formFieldRelations('sd-line-input'))
    .directive('sdInput', formFieldRelations('sd-input'))
    .directive('sdSwitch', switchSemantics)
    .directive('sdSwitchInverted', invertedSwitchSemantics)
    .directive('sdCheck', checkSemantics)
    .directive('i', decorativeIcon)
    .directive('sdTooltip', tooltipName);
