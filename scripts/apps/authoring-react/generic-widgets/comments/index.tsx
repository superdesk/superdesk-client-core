import React from 'react';
import {gettext} from 'core/utils';
import {IGenericSideWidget, IRestApiResponse} from 'superdesk-api';
import CommentsWidget from './CommentsWidget';
import {IComment} from './interfaces';
import {httpRequestJsonLocal} from 'core/helpers/network';

type IProps<T> = React.ComponentProps<IGenericSideWidget<T>['component']>;

class Component<T> extends React.PureComponent<IProps<T>> {
    render() {
        return (
            <CommentsWidget
                entityId={this.props.entityId}
                readOnly={this.props.readOnly}
                contentProfile={this.props.contentProfile}
                fieldsData={this.props.fieldsData}
                authoringStorage={this.props.authoringStorage}
                fieldsAdapter={this.props.fieldsAdapter}
                storageAdapter={this.props.storageAdapter}
                onFieldsDataChange={this.props.onFieldsDataChange}
                handleUnsavedChanges={this.props.handleUnsavedChanges}
                getComments={() => {
                    const itemId = this.props.entityId;

                    if (itemId == null) {
                        return Promise.resolve([]);
                    }

                    const criteria = {
                        where: {
                            item: itemId,
                        },
                        embedded: {user: 1},
                    };

                    return httpRequestJsonLocal<IRestApiResponse<IComment>>({
                        method: 'GET',
                        path: '/comments', // TODO: Update endpoint
                        urlParams: criteria,
                    }).then(({_items}) => _items);
                }}
                addComment={(text) => {
                    return httpRequestJsonLocal({
                        method: 'POST',
                        path: '/comments', // TODO: Update endpoint
                        payload: {
                            item: this.props.entityId,
                            text: text,
                        },
                    });
                }}
            />
        );
    }
}

export function getCommentsWidgetGeneric<T>() {
    const widget: IGenericSideWidget<T> = {
        _id: 'comments-widget-generic',
        label: gettext('Comments'),
        order: 2,
        icon: 'chat',
        component: Component,
    };

    return widget;
}
