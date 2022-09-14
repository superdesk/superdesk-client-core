/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticleSideWidget, IExtensionActivationResult, IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {InlineCommentsWidget} from '../generic-widgets/inline-comments';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Inline comments');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

class InlineCommentsWidgetWrapper extends React.PureComponent<IProps> {
    render() {
        return (
            <InlineCommentsWidget<IArticle>
                readOnly={this.props.readOnly}
                contentProfile={this.props.contentProfile}
                fieldsData={this.props.fieldsData}
                authoringStorage={this.props.authoringStorage}
                fieldsAdapter={this.props.fieldsAdapter}
                storageAdapter={this.props.storageAdapter}
                onFieldsDataChange={this.props.onFieldsDataChange}
                handleUnsavedChanges={this.props.handleUnsavedChanges}
            />
        );
    }
}

export function getInlineCommentsWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'inline-comments-widget',
        label: getLabel(),
        order: 2,
        icon: 'comments',
        component: InlineCommentsWidgetWrapper,
        isAllowed: (item) => item._type !== 'legal_archive',
    };

    return metadataWidget;
}
