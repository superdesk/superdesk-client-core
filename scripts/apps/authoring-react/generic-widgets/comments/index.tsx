import React from 'react';
import {IComment, IGenericSideWidget} from 'superdesk-api';
import {gettext} from 'core/utils';
import CommentsWidget from './CommentsWidget';

type IProps<T> = React.ComponentProps<IGenericSideWidget<T>['component']>;

export const COMMENT_WIDGET_ID = 'comments-widget';

export function getCommentsWidgetGeneric<T>(
    getComments: (entityId: string) => Promise<Array<IComment>>,
    addComment: (entityId: string, text: string) => Promise<void>,
    isAllowed: (entity: T) => boolean,
) {
    class Component extends React.PureComponent<IProps<T>> {
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
                    getComments={() => getComments(this.props.entityId)}
                    addComment={(text) => addComment(this.props.entityId, text)}
                />
            );
        }
    }

    const widget: IGenericSideWidget<T> = {
        _id: COMMENT_WIDGET_ID,
        label: gettext('Comments'),
        order: 2,
        icon: 'chat',
        component: Component,
        isAllowed: isAllowed,
    };

    return widget;
}
