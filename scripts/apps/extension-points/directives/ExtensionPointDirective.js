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
 * See also ExtensionPointsService.
 */
ExtensionPointDirective.$inject = ['extensionPoints', 'lodash', '$q'];
export function ExtensionPointDirective(extensionPoints, _, $q) {
    function _buildCompoment(extension, scope) {
        // for easy access put values from parent scope into ...
        const callback = extension.onInit && extension.onInit(extension, scope) || $q.resolve();

        return callback
            .then(() => {
                if (!_.get(extension, 'props.store', null)) {
                    // ... the component's props or ...
                    extension.data.forEach((value) => {
                        extension.props[value] = scope.$parent.$eval(value);
                    });
                } else {
                    // ... into the component's redux store
                    extension.data.forEach((value) => {
                        extension.props.store.getState()[value] = scope.$parent.$eval(value);
                    });
                }

                return React.createElement(extension.componentClass, extension.props);
            });
    }

    return {
        link: function(scope, elem, attr) {
            const registeredExtensions = extensionPoints.get(attr.sdExtensionPoint);

            $q.all(
                registeredExtensions.map((extension, index) => (
                    _buildCompoment(extension, scope)
                ))
            )
                .then((components) => {
                    const elements = components.map((component, index) => (
                        <span key={`${attr.sdExtensionPoint}-${index}`}>
                            {component}
                        </span>
                    ));

                    ReactDOM.render(elements, elem[0]);

                    scope.$on('$destroy', () => {
                        ReactDOM.unmountComponentAtNode(elem[0]);
                    });
                });
        },
    };
}
