import './styles.scss';

import SuggestService from './SuggestService';
import SuggestDirective from './SuggestDirective';

/**
 * @ngdoc module
 * @module apps.authoring.suggest
 * @name apps.authoring.suggest
 * @packageName apps
 * @description The suggest module enriches the authoring component with live
 * suggest functionality.
 */
export default angular.module('superdesk.apps.authoring.suggest', [])
    .service('suggest', SuggestService)
    .directive('sdSuggest', SuggestDirective);
