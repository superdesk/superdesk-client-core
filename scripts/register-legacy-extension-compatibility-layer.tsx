import React from 'react';
import {IExtensionActivationResult} from 'superdesk-api';
import {registerInternalExtension} from 'core/helpers/register-internal-extension';
import ng from 'core/services/ng';

interface ILegacyExtensionPoint {
    type: string;
    componentClass: React.ComponentType<any>;
    data: unknown;
    onInit: unknown;
    props: {[key: string]: unknown};
}

export function registerLegacyExtensionCompatibilityLayer() {
    const extensionActivationResult: IExtensionActivationResult = {
        contributions: {
            publishingSections: (ng.get('extensionPoints').get('authoring:publish') as Array<ILegacyExtensionPoint>)
                .map((api) => {
                    const Component = api.componentClass;

                    return {
                        component: function LegacyExtensionCompatibilityLayerComponentWrapper(props) {
                            return (
                                <Component {...api.props} item={props.item} />
                            );
                        },
                    };
                }),
        },
    };

    registerInternalExtension('extensionCompatibilityLayer', extensionActivationResult);
}
