import React from "react";
import {extensions} from "./extension-imports.generated";
import {logger} from "./services/logger";

export class ExtensionPage extends React.Component {
    render() {
        const currentUrl = window.location.hash.slice(1, window.location.hash.length);

        const extensionObject = Object.values(extensions).find(
            ({extension}) =>
                extension.contribute != null
                && extension.contribute.pages.find(({url}) => url === currentUrl) != null,
        );

        if (extensionObject != null) {
            const Component = extensionObject.extension.contribute.pages.find(({url}) => url === currentUrl).component;

            return <Component superdesk={extensionObject.apiInstance} />;
        } else {
            logger.error(new Error(`Could not find a component for extension page. URL: ${currentUrl}`));
            return null;
        }
    }
}
