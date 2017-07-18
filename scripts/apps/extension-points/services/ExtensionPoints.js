/**
 * @ngdoc provider
 * @module superdesk.apps.extension-points
 * @name extensionPoints
 * @packageName superdesk.apps
 * @description
 * External superdesk apps can register components that then will be hooked into
 * the core UI.
 * Inject 'extensionPointsProvider' into your module and then:
 *
 * extensionPointsProvider.register('MY_TYPE', MyComponent, an_array); // do this in config phase
 *
 * where MyComponent is a React component and an_array is an array with names
 * of variables that your component will receive as props from the parent
 * scope, for example: ['item'].
 *
 * See also ExtensionPointsDirective.
 */
export function ExtensionPointsProvider() {
    var extensions = {};

    this.register = function(type, componentClass, data) {
        if (typeof extensions[type] === 'undefined') {
            extensions[type] = [];
        }
        extensions[type].push({type: type, componentClass: componentClass, data: data});
    };

    this.$get = function() {
        return extensions;
    };
}
