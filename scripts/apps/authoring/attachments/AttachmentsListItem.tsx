import * as React from 'react';
import {IAttachment} from 'superdesk-api';
import {gettext} from 'core/utils';
import {filesize, fileicon} from 'core/ui/ui';
import {Item, Column, Row, ActionMenu} from 'core/ui/components/List';
import {attachmentsApi} from './attachmentsService';

interface IProps {
    attachment: IAttachment;
    readOnly: boolean;

    editAttachment: (attachment: IAttachment) => void;
    removeAttachment: (attachment: IAttachment) => void;

    noBackground?: boolean;
}

export class AttachmentsListItem extends React.PureComponent<IProps> {
    render() {
        const {attachment, readOnly, editAttachment, removeAttachment, noBackground} = this.props;

        return (
            <Item shadow={1} noBg={noBackground === true}>
                <Column border={true} title={attachment.mimetype}>
                    <i className={`big-icon--${fileicon(attachment.mimetype)}`} />
                </Column>
                <Column grow={true}>
                    <Row>
                        <h4>{attachment.title}</h4>
                    </Row>
                    <Row>
                        <h5>{attachment.filename} {`(${filesize(attachment.media.length)})`}</h5>
                    </Row>
                    <Row>
                        <div className="description">{attachment.description}</div>
                    </Row>
                    {
                        attachment.internal === true && (
                            <Row>
                                <span className="label label--orange2">internal</span>
                            </Row>
                        )
                    }
                </Column>

                <ActionMenu row={true}>
                    <button
                        className="dropdown__toggle"
                        onClick={() => attachmentsApi.download(attachment)}
                        title={gettext('Download')}
                    >
                        <i className="icon-download" />
                    </button>

                    {
                        readOnly === true ? null : (
                            <button
                                className="dropdown__toggle"
                                onClick={() => editAttachment(attachment)}
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
                                onClick={() => removeAttachment(attachment)}
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
}
