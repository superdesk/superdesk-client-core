import {reactToAngular1} from 'superdesk-ui-framework';

import './attachments.scss';
import {gettext} from 'core/utils';
import AttachmentsEditorDirective from './AttachmentsEditorDirective';
import {AttachmentsWidget} from './AttachmentsWidget';

const config = (awp) =>
    awp.widget('attachments', {
        icon: 'attachment',
        label: gettext('Attachments'),
        template: 'scripts/apps/authoring/attachments/attachments.html',
        order: 8,
        side: 'right',
        badge: ['item', (item) => item.attachments && item.attachments.length],
        display: {
            authoring: true,
            packages: true,
            killedItem: true,
            legalArchive: false,
            archived: false,
            picture: true,
            personal: true,
        },
        feature: 'editorAttachments',
    });

angular.module('superdesk.apps.authoring.attachments', [
    'superdesk.config',
    'superdesk.core.api',
    'superdesk.apps.authoring.widgets',
])
    .config(['authoringWidgetsProvider', config])
    .directive('sdAttachmentsEditor', AttachmentsEditorDirective)
    .component('sdAttachmentsWidget', reactToAngular1(
        AttachmentsWidget,
        ['item', 'readOnly', 'updateItem'],
        [],
        'display:contents'),
    )
;
