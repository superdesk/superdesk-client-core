import * as React from 'react';
import {IArticle, IAttachment} from 'superdesk-api';
import {isLockedInCurrentSession, dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {notify} from 'core/notify/notify';
import {gettext, gettextPlural} from 'core/utils';
import {filesize} from 'core/ui/ui';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from './AttachmentsWidgetComponent';
import {WithAttachments} from './AttachmentsWrapper';

interface IProps {
    item: IArticle;
    updateItem(updates: Partial<IArticle>): void;
    readOnly: boolean;
    isWidget: boolean;
}

export function isUploadValid(files: Array<File>, readOnly: boolean, currentAttachments: Array<IAttachment>): boolean {
    if (files.length === 0 || readOnly) {
        return false;
    } else if (files.length + currentAttachments.length >= appConfig.attachments_max_files) {
        notify.error(gettextPlural(
            appConfig.attachments_max_files,
            'Too many files selected. Only 1 file is allowed',
            'Too many files selected. Only {{count}} files are allowed',
            {count: appConfig.attachments_max_files},
        ));

        return false;
    }

    const filenames = files.filter((file) => file.size > appConfig.attachments_max_size)
        .map((file) => file.name);

    if (filenames.length > 0) {
        notify.error(gettext(
            'Sorry, but some files "{{filenames}}" are bigger than limit ({{limit}})',
            {
                filenames: filenames.join(', '),
                limit: filesize(appConfig.attachments_max_size),
            },
        ));
        return false;
    }

    return true;
}

export class AttachmentsWidget extends React.PureComponent<IProps> {
    render() {
        const Widget = CC.AuthoringAttachmentsWidget != null ?
            CC.AuthoringAttachmentsWidget :
            AttachmentsWidgetComponent;

        const editable = this.props.readOnly !== true && (
            sdApi.article.isLocked(this.props.item) !== true
            || isLockedInCurrentSession(this.props.item)
        );

        const readOnly = editable !== true;

        return (
            <WithAttachments item={this.props.item}>
                {(attachments) => {
                    return (
                        <Widget
                            attachments={attachments}
                            readOnly={readOnly}
                            isWidget={this.props.isWidget}
                            addAttachments={(newAttachments) => {
                                const nextAttachments = attachments.concat(newAttachments);

                                this.props.updateItem({
                                    attachments: nextAttachments.map((attachment) => ({attachment: attachment._id})),
                                });

                                dispatchCustomEvent('attachmentsAdded', newAttachments);
                            }}
                            removeAttachment={(attachment) => {
                                const nextAttachments = attachments.filter(
                                    (_attachment) => _attachment._id !== attachment._id,
                                );

                                this.props.updateItem({
                                    attachments: nextAttachments.map((_attachment) => ({attachment: _attachment._id})),
                                });

                                dispatchCustomEvent('attachmentRemoved', attachment);
                            }}
                            onAttachmentUpdated={(attachment) => {
                                dispatchCustomEvent('attachmentUpdated', attachment);
                            }}
                            isUploadValid={(files: Array<File>) => isUploadValid(files, readOnly, attachments)}
                        />
                    );
                }}
            </WithAttachments>
        );
    }
}
