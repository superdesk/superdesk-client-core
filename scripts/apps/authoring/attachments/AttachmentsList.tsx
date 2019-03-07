/* eslint-disable react/no-multi-comp */

import React from 'react';
import {Provider, connect} from 'react-redux';
import {gettext} from 'core/utils';
import {filesize, fileicon} from 'core/ui/ui';

import {
    editFile,
    download,
    removeFile,
} from './actions';

import {Item, Column, Row, ActionMenu} from 'core/ui/components/List';

import {IAttachment} from '.';

interface IProps {
    files: Array<IAttachment>;
    isLocked: boolean;

    editFile: (file: IAttachment) => void;
    download: (file: IAttachment) => void;
    removeFile: (file: IAttachment) => void;
}

class AttachmentsListComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.renderFile = this.renderFile.bind(this);
    }

    renderFile(file: IAttachment) {
        const {isLocked, download: _download, editFile: _editFile, removeFile: _removeFile} = this.props;

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
                </Column>
                <ActionMenu row={true}>
                    <button className="dropdown__toggle"
                        onClick={() => _download(file)}
                        title={gettext('Download')}>
                        <i className="icon-download" />
                    </button>
                    {!isLocked && <button className="dropdown__toggle"
                        onClick={() => _editFile(file)}
                        title={gettext('Edit')}>
                        <i className="icon-pencil" />
                    </button>}
                    <button className="dropdown__toggle"
                        onClick={() => _removeFile(file)}
                        title={gettext('Remove')}>
                        <i className="icon-trash" />
                    </button>
                </ActionMenu>
            </Item>
        );
    }

    render() {
        const {files} = this.props;

        return (
            <div className="attachments-list">
                {!!files.length &&
                    <ul>
                        {files.map(this.renderFile)}
                    </ul>
                }
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    files: state.attachments.files,
    isLocked: state.editor.isLocked,
});

const mapDispatchToProps = {
    editFile,
    download,
    removeFile,
};

const AttachmentsListConnected = connect(mapStateToProps, mapDispatchToProps)(AttachmentsListComponent);

export const AttachmentsList = (props: {store: any}) => (
    <Provider store={props.store}>
        <AttachmentsListConnected />
    </Provider>
);
