import React from 'react';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {AuthoringReact} from './authoring-react';
import {authoringStorageIArticle} from './data-layer';
import {getFieldsAdapter} from './field-adapters';

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
                authoringStorage={authoringStorageIArticle}
                fieldsAdapter={getFieldsAdapter(authoringStorageIArticle)}
            />
        );
    }
}
