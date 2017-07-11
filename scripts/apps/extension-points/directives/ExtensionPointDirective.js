import ReactDOM from 'react-dom';
import React from 'react';

/**
 * sdExtensionPoint can be used by plugins to hook into the core UI
 *
 * Usage:
 * TODO
 *
 * Params:
 *
 * @scope {string} extension-point-type - TODO
 *
 */

function propsFromData(data, scope) {
    var json = {};

    _.forEach(data, (value) => {
        json[value] = scope.$parent.$eval(value);
    });
    return json;
}

ExtensionPointDirective.$inject = ['extensionPoints'];
export function ExtensionPointDirective(extensionPoints) {
    return {
        scope: {
            sdExtensionPointType: '@',
        },
        link: function(scope, elem) {
            var extensions = _.map(extensionPoints.extensions[scope.sdExtensionPointType],
                                (extension) => React.createElement(
                                    extension.componentClass,
                                    propsFromData(extension.data, scope)
                                )
                            );

            ReactDOM.render(
                <span>{extensions}</span>,
                elem[0]
            );
        }
    };
}
