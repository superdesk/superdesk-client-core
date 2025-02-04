import * as directive from './directives';
import * as svc from './services';

angular.module('superdesk.apps.extension-points', [])
    .directive('sdExtensionPoint', directive.ExtensionPointDirective)
    .service('extensionPoints', svc.ExtensionPointsService);
