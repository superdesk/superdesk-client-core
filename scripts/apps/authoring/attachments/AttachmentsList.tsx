/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {gettext} from 'core/utils';
import {filesize, fileicon} from 'core/ui/ui';

import {Item, Column, Row, ActionMenu} from 'core/ui/components/List';

import {IAttachment} from 'superdesk-api';
import {attachmentsApi} from './attachmentsService';

interface IProps {
    attachments: Array<IAttachment>;
    readOnly: boolean;

    editAttachment: (attachment: IAttachment) => void;
    removeAttachment: (attachment: IAttachment) => void;
}

export class AttachmentsList extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.renderAttachment = this.renderAttachment.bind(this);
    }

    renderAttachment(file: IAttachment) {
        const {readOnly, editAttachment, removeAttachment} = this.props;

        return (
            <Item key={file._id} shadow={1}>
                <Column border={true} title={file.mimetype}>
                    <i className={`big-icon--${fileicon(file.mimetype)}`} />
                </Column>
                <Column grow={true}>
                    <Row>
                        <h4>{file.title}</h4>
                    </Row>
                    <Row>
                        <h5>{file.filename} {`(${filesize(file.media.length)})`}</h5>
                    </Row>
                    <Row>
                        <div className="description">{file.description}</div>
                    </Row>
                    {
                        file.internal === true && (
                            <Row>
                                <span className="label label--orange2">internal</span>
                            </Row>
                        )
                    }
                </Column>
                <ActionMenu row={true}>
                    <button
                        className="dropdown__toggle"
                        onClick={() => attachmentsApi.download(file)}
                        title={gettext('Download')}
                    >
                        <i className="icon-download" />
                    </button>

                    {
                        readOnly === true ? null : (
                            <button
                                className="dropdown__toggle"
                                onClick={() => editAttachment(file)}
                                title={gettext('Edit')}
                            >
                                <i className="icon-pencil" />
                            </button>
                        )
                    }

                    {
                        readOnly === true ? null : (
                            <button
                                className="dropdown__toggle"
                                onClick={() => removeAttachment(file)}
                                title={gettext('Remove')}
                            >
                                <i className="icon-trash" />
                            </button>
                        )
                    }
                </ActionMenu>
            </Item>
        );
    }

    render() {
        const {attachments} = this.props;

        return (
            <div className="attachments-list">
                {!!attachments.length && (
                    <ul>
                        {attachments.map(this.renderAttachment)}
                    </ul>
                )}
            </div>
        );
    }
}
