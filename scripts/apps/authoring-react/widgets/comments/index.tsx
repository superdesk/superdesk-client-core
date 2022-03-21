/* eslint-disable react/no-multi-comp */
import {IAuthoringSideWidget} from 'superdesk-api';
import {gettext} from 'core/utils';
import CommentsWidget from './CommentsWidget';
// Can't call `gettext` in the top level
const getLabel = () => gettext('Comments');

export function getCommentsWidget() {
    const metadataWidget: IAuthoringSideWidget = {
        _id: 'comments-widget',
        label: getLabel(),
        order: 3,
        icon: 'chat',
        component: CommentsWidget,
        isAllowed: (item) => item._type !== 'legal_archive',
    };

    return metadataWidget;
}
