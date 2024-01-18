/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {IAttachment} from 'superdesk-api';
import {AttachmentsListItem} from './AttachmentsListItem';

interface IProps {
    attachments: Array<IAttachment>;
    readOnly: boolean;

    editAttachment: (attachment: IAttachment) => void;
    removeAttachment: (attachment: IAttachment) => void;
}

export class AttachmentsList extends React.PureComponent<IProps> {
    render() {
        const {attachments} = this.props;

        return (
            <div className="attachments-list">
                {!!attachments.length && (
                    <ul>
                        {attachments.map((attachment) => (
                            <AttachmentsListItem
                                key={attachment._id}
                                attachment={attachment}
                                readOnly={this.props.readOnly}
                                editAttachment={this.props.editAttachment}
                                removeAttachment={this.props.removeAttachment}
                            />
                        ))}
                    </ul>
                )}
            </div>
        );
    }
}
