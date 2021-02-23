/* eslint-disable react/no-multi-comp */
import * as React from 'react';
import classNames from 'classnames';

import {FileiconFilter, FilesizeFilter} from 'core/ui/ui';
import {gettext} from 'core/utils';
import {IAttachment, IAttachmentsWrapperProps} from 'superdesk-api';
import {withAttachments} from 'apps/authoring/attachments/AttachmentsWrapper';

interface IAttachmentItemProps {
    attachment: IAttachment;
    selected: boolean;
    onClick: (attachment: IAttachment) => void;
}

export class AttachmentItem extends React.PureComponent<IAttachmentItemProps> {
    render() {
        const {attachment} = this.props;
        const fileicon = 'big-icon--' + FileiconFilter()(attachment.mimetype);
        const filesize = FilesizeFilter()(attachment.media.length);

        const className = classNames('sd-list-item', {
            'sd-list-item--active': this.props.selected,
        });

        return (
            <div key={attachment._id} className={className} onClick={() => this.props.onClick(attachment)}>
                <div className="sd-list-item__column sd-list-item__column--no-border">
                    <i className={fileicon} />
                </div>
                <div className="sd-list-item__column sd-list-item__column--grow">
                    <div className="sd-list-item__row">
                        <h4>{attachment.title}</h4>
                    </div>
                    <div className="sd-list-item__row">
                        <h5>{attachment.filename} ({filesize})</h5>
                    </div>
                    <div className="sd-list-item__row description">
                        {attachment.description}
                    </div>
                </div>
            </div>
        );
    }
}

interface IProps extends IAttachmentsWrapperProps {
    selected: string;
    onClick: (attachment: IAttachment) => void;
}

export class AttachmentListComponent extends React.PureComponent<IProps> {
    render() {
        if (this.props.attachments.length === 0) {
            return null; // wait for attachments
        }

        const publicAttachments = this.props.attachments.filter(({internal}) => !internal);

        const attachments = publicAttachments
            .map((attachement) => (
                <AttachmentItem
                    key={`attachment-${attachement._id}`}
                    attachment={attachement}
                    selected={attachement._id === this.props.selected}
                    onClick={this.props.onClick}
                />
            ));

        if (attachments.length) {
            return <div>{attachments}</div>;
        }

        return (
            <p style={{padding: 20, margin: 0}}>
                {gettext('There are no public attachments yet. Upload some first using Attachments widget.')}
            </p>
        );
    }
}

export const AttachmentList = withAttachments(AttachmentListComponent);
