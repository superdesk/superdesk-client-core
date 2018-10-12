import './styles.scss';

import SuggestService from './SuggestService';
import SuggestDirective from './SuggestDirective';

export default angular.module('superdesk.apps.authoring.suggest', [])
    .service('suggest', SuggestService)
    .directive('sdSuggest', SuggestDirective);
