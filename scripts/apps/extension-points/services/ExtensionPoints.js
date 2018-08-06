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
 * extensionPoints.register('MY_TYPE', MyConnectedComponent, props, data, onInit); // do this in config phase
 *
 * where MyConnectedComponent is a React component, the props is a json object that may contain a
 * redux store and data is an array with names of variables that your component will receive as props
 * from the parent scope, for example: ['item'].
 * onInit: callback while rendering build React components
 * See also ExtensionPointsDirective.
 */
export function ExtensionPointsService() {
    this.extensions = {};

    this.register = function(type, componentClass, props = {}, data = [], onInit = null) {
        if (typeof this.extensions[type] === 'undefined') {
            this.extensions[type] = [];
        }
        this.extensions[type].push({type, componentClass, props, data, onInit});
    };

    this.get = (type) => {
        if (typeof this.extensions[type] === 'undefined') {
            return [];
        }
        return this.extensions[type];
    };
}
