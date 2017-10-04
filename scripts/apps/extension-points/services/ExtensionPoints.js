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
 * extensionPointsProvider.register('MY_TYPE', MyConnectedComponent, props, an_array); // do this in config phase
 *
 * where MyConnectedComponent is a React component, the props is a json object that needs to contain at least the
 * redux store and an_array is an array with names
 * of variables that your component will receive as props from the parent scope, for example: ['item'].
 *
 * See also ExtensionPointsDirective.
 */
export function ExtensionPointsService() {
    this.extensions = {};

    this.register = function(type, componentClass, props, data) {
        if (typeof this.extensions[type] === 'undefined') {
            this.extensions[type] = [];
        }
        this.extensions[type].push({type, componentClass, props, data});
    };
}
