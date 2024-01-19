/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IArticleSideWidget, IComment, IExtensionActivationResult, IRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import CommentsWidget from '../../generic-widgets/comments/CommentsWidget';
import {httpRequestJsonLocal} from 'core/helpers/network';
// Can't call `gettext` in the top level
const getLabel = () => gettext('Comments');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

class Component extends React.PureComponent<IProps> {
    render() {
        return (
            <CommentsWidget
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
