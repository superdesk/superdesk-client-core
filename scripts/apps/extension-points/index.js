import * as directive from './directives';
import * as svc from './services';

/*
 * Extension Points
 * ----------------
 * Usage:
 * 1. Place this tag in a view where you'd like to add an extension:
 *   <span sd-extension-point="MY_TYPE"></span>
 *
 * 2. Your extension then needs to register one or more components that get
 *    placed at the tag from the previous step.
 *    Inject 'extensionPointsProvider' into your module and then:
 *
 *    extensionPointsProvider.register('MY_TYPE', MyComponent, an_array); // do this in config phase
 *
 *    where MyComponent is a React component and an_array is an array with names
 *    of variables that your component will receive as props from the parent
 *    scope, for example: ['item'].
 *
 */

angular.module('superdesk.apps.extension-points', [])
    .directive('sdExtensionPoint', directive.ExtensionPointDirective)
    .provider('extensionPoints', svc.ExtensionPointsProvider);
