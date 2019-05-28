import React from 'react';
import {extensions} from './extension-imports.generated';
import {logger} from './services/logger';

export class ExtensionPage extends React.Component {
    render() {
        const currentUrl = window.location.hash.slice(1);

        const extensionObject = Object.values(extensions).find(
            ({activationResult}) =>
                activationResult.contributions != null
                && activationResult.contributions.pages.find(({url}) => url === currentUrl) != null,
        );

        if (extensionObject != null) {
            const Component = extensionObject.activationResult.contributions.pages.find(
                ({url}) => url === currentUrl,
            ).component;

            return <Component />;
        } else {
            logger.error(new Error(`Could not find a component for extension page. URL: ${currentUrl}`));
            return null;
        }
    }
}
