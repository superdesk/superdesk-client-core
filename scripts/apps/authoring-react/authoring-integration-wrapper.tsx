import React from 'react';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {AuthoringReact} from './authoring-react';

interface IProps {
    itemId: IArticle['_id'];
}

/**
 * The purpose of the wrapper is to handle integration with the angular part of the application.
 * The main component will not know about angular.
 */
export class AuthoringIntegrationWrapper extends React.PureComponent<IProps> {
    render() {
        return (
            <AuthoringReact
                itemId={this.props.itemId}
                onClose={() => {
                    ng.get('authoringWorkspace').close();
                    ng.get('$rootScope').$applyAsync();
                }}
            />
        );
    }
}
