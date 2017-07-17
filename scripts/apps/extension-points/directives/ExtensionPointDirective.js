import ReactDOM from 'react-dom';
import React from 'react';

/**
 * sdExtensionPoint can be used by plugins to hook into the core UI
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
            var registeredExtenstions = extensionPoints.extensions[attr.sdExtensionPoint];
            var components = _.map(registeredExtenstions, (extension) => buildCompoment(extension, scope));

            ReactDOM.render(
                <span>{components}</span>,
                elem[0]
            );
        }
    };
}
