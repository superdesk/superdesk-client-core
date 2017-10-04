import ReactDOM from 'react-dom';
import React from 'react';

/**
 * @ngdoc directive
 * @module superdesk.apps.extension-points
 * @name extensionPointDirective
 * @packageName superdesk.apps
 * @description
 * External superdesk apps can register components that then will be hooked into
 * the core UI.
 * Place this tag in a view where you'd like to add an extension:
 *   <span sd-extension-point="MY_TYPE"></span>
 * See also ExtensionPointsProvider.
 */
ExtensionPointDirective.$inject = ['extensionPoints'];
export function ExtensionPointDirective(extensionPoints) {
    function _buildCompoment(extension, scope) {
        // for easy access put values from parent scope into the redux store of the extension
        _.forEach(extension.data, (value) => {
            extension.props.store.getState()[value] = scope.$parent.$eval(value);
        });
        return React.createElement(extension.componentClass, extension.props);
    }

    return {
        link: function(scope, elem, attr) {
            var registeredExtenstions = extensionPoints.extensions[attr.sdExtensionPoint];
            var components = _.map(registeredExtenstions, (extension) => _buildCompoment(extension, scope));

            ReactDOM.render(
                <span>{components}</span>,
                elem[0]
            );
        }
    };
}
