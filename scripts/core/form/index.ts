
import InputDirective from './InputDirective';
import SelectDirective from './SelectDirective';
import SwitchInvertedDirective from './SwitchInvertedDirective';
import CheckboxDirective from './CheckboxDirective';

angular.module('superdesk.core.form', [])
    .directive('sdFormInput', InputDirective)
    .directive('sdFormSelect', SelectDirective)
    .directive('sdFormCheckbox', CheckboxDirective)
    .directive('sdFormSwitchInverted', SwitchInvertedDirective)
;
