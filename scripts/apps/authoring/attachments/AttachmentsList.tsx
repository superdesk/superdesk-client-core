/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {gettext} from 'core/utils';
import {filesize, fileicon} from 'core/ui/ui';

import {Item, Column, Row, ActionMenu} from 'core/ui/components/List';

import {IAttachment} from 'superdesk-api';

interface IProps {
    files: Array<IAttachment>;
    readOnly: boolean;

    editFile: (file: IAttachment) => void;
    download: (file: IAttachment) => void;
    removeFile: (file: IAttachment) => void;
}

export class AttachmentsList extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.renderFile = this.renderFile.bind(this);
    }

    renderFile(file: IAttachment) {
        const {readOnly, download, editFile, removeFile} = this.props;

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
                        onClick={() => download(file)}
                        title={gettext('Download')}
                    >
                        <i className="icon-download" />
                    </button>

                    {
                        readOnly === true ? null : (
                            <button
                                className="dropdown__toggle"
                                onClick={() => editFile(file)}
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
                                onClick={() => removeFile(file)}
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
        const {files} = this.props;

        return (
            <div className="attachments-list">
                {!!files.length && (
                    <ul>
                        {files.map(this.renderFile)}
                    </ul>
                )}
            </div>
        );
    }
}
