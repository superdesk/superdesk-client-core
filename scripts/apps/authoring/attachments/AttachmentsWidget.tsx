import * as React from 'react';
import {IArticle, IAttachment, IAttachmentsWidgetProps, IAttachmentsWrapperProps} from 'superdesk-api';
import {isLockedInCurrentSession, dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {sdApi} from 'api';
import {appConfig} from 'appConfig';
import {notify} from 'core/notify/notify';
import {gettext, gettextPlural} from 'core/utils';
import {filesize} from 'core/ui/ui';
import {CC} from 'core/ui/configurable-ui-components';
import {AttachmentsWidgetComponent} from './AttachmentsWidgetComponent';
import {withAttachments} from './AttachmentsWrapper';

interface IProps extends IAttachmentsWrapperProps {
    updateItem(updates: Partial<IArticle>): void;
    readOnly: boolean;
}

class AttachmentsWidgetWrapper extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.addAttachments = this.addAttachments.bind(this);
        this.removeAttachment = this.removeAttachment.bind(this);
        this.updateAttachment = this.updateAttachment.bind(this);
        this.isUploadValid = this.isUploadValid.bind(this);
    }

    addAttachments(newAttachments: Array<IAttachment>) {
        const attachments = this.props.attachments.concat(newAttachments);

        if (this.props.updateItem != null) {
            this.props.updateItem({
                attachments: attachments.map((attachment) => ({attachment: attachment._id})),
            });
        }

        dispatchCustomEvent('attachmentsAdded', newAttachments);
    }

    removeAttachment(attachment: IAttachment) {
        const attachments = this.props.attachments.filter(
            (_attachment) => _attachment._id !== attachment._id,
        );

        if (this.props.updateItem != null) {
            this.props.updateItem({
                attachments: attachments.map((_attachment) => ({attachment: _attachment._id})),
            });
        }

        dispatchCustomEvent('attachmentRemoved', attachment);
    }

    updateAttachment(attachment: IAttachment) {
        dispatchCustomEvent('attachmentUpdated', attachment);
    }

    isUploadValid(files: Array<File>) {
        if (files.length === 0 || !sdApi.article.isLocked(this.props.item)) {
            return false;
        } else if (files.length + this.props.attachments.length > appConfig.attachments_max_files) {
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

    render() {
        const Widget = CC.AuthoringAttachmentsWidget != null ?
            CC.AuthoringAttachmentsWidget :
            AttachmentsWidgetComponent;

        return (
            <Widget
                {...this.props}
                editable={!!this.props.item._editable}
                isLocked={sdApi.article.isLocked(this.props.item)}
                isLockedByMe={isLockedInCurrentSession(this.props.item)}
                isUploadValid={this.isUploadValid}
                addAttachments={this.addAttachments}
                removeAttachment={this.removeAttachment}
                updateAttachment={this.updateAttachment}
            />
        );
    }
}

export const AttachmentsWidget = withAttachments(AttachmentsWidgetWrapper);
