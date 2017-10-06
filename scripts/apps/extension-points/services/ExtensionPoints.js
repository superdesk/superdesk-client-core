/**
 * @ngdoc provider
 * @module superdesk.apps.extension-points
 * @name extensionPoints
 * @packageName superdesk.apps
 * @description
 * External superdesk apps can register components that then will be hooked into
 * the core UI.
 * Inject 'extensionPoints' into your module and then:
 *
 * extensionPoints.register('MY_TYPE', MyConnectedComponent, props, data); // do this in config phase
 *
 * where MyConnectedComponent is a React component, the props is a json object that needs to contain at least the
 * redux store and data is an array with names
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
