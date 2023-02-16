import React from 'react';
import {extensions} from 'appConfig';
import {logger} from './services/logger';
import {flatMap} from 'lodash';
import {getUrlPage} from './helpers/url';
import {IFullWidthPageCapabilityConfiguration} from 'superdesk-api';

interface IProps {
    setupFullWidthCapability: (config: IFullWidthPageCapabilityConfiguration) => void;
}

export class ExtensionPage extends React.Component<IProps> {
    render() {
        const currentUrl = getUrlPage();

        const pages = flatMap(
            Object.values(extensions),
            (extension) => extension.activationResult?.contributions?.pages ?? [],
        );

        const currentPage = pages.find(({url}) => url === currentUrl);

        if (currentPage != null) {
            const Component = currentPage.component;

            return (
                <Component
                    setupFullWidthCapability={this.props.setupFullWidthCapability}
                />
            );
        } else {
            logger.error(new Error(`Could not find a component for extension page. URL: ${currentUrl}`));
            return null;
        }
    }
}
