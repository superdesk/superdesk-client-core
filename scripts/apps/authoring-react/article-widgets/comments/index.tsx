/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IArticleSideWidget, IArticleSideWidgetComponentType, IComment, IRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import CommentsWidget from '../../generic-widgets/comments/CommentsWidget';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {notify} from 'core/notify/notify';
// Can't call `gettext` in the top level
const getLabel = () => gettext('Comments');

class Component extends React.PureComponent<IArticleSideWidgetComponentType> {
    render() {
        return (
            <CommentsWidget
                initialState={this.props.initialState}
                entityId={this.props.article._id}
                readOnly={this.props.readOnly}
                contentProfile={this.props.contentProfile}
                fieldsData={this.props.fieldsData}
                authoringStorage={this.props.authoringStorage}
                fieldsAdapter={this.props.fieldsAdapter}
                storageAdapter={this.props.storageAdapter}
                onFieldsDataChange={this.props.onFieldsDataChange}
                handleUnsavedChanges={this.props.handleUnsavedChanges}
                getComments={() => {
                    const itemId = this.props.article?._id;

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
                        path: '/item_comments',
                        urlParams: criteria,
                    }).then(({_items}) => _items);
                }}
                addComment={(text) => {
                    return httpRequestJsonLocal({
                        method: 'POST',
                        path: '/item_comments',
                        payload: {
                            item: this.props.article._id,
                            text: text,
                        },
                    })
                    .then((res: void) => res)
                    .catch((error) => {
                        if (error.data._issues?.text != null) {
                            notify.error(error.data._issues.text)
                        }
                    });
                }}
            />
        );
    }
}

export function getCommentsWidget() {
    const widget: IArticleSideWidget = {
        _id: 'comments-widget',
        label: getLabel(),
        order: 3,
        icon: 'chat',
        component: Component,
        isAllowed: (item) => item._type !== 'legal_archive',
    };

    return widget;
}
