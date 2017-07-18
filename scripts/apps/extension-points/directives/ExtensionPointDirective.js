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
    function propsFromData(data, scope) {
        var json = {};

        _.forEach(data, (value) => {
            json[value] = scope.$parent.$eval(value);
        });
        return json;
    }

    function buildCompoment(extension, scope) {
        return React.createElement(
            extension.componentClass,
            propsFromData(extension.data, scope)
        );
    }

    return {
        link: function(scope, elem, attr) {
            var registeredExtenstions = extensionPoints[attr.sdExtensionPoint];
            var components = _.map(registeredExtenstions, (extension) => buildCompoment(extension, scope));

            ReactDOM.render(
                <span>{components}</span>,
                elem[0]
            );
        }
    };
}
