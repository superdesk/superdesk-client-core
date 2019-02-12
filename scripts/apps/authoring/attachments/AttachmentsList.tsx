import React from 'react';
import {connect} from 'react-redux';
import {gettext} from 'core/utils';

import {
    editFile,
    download,
    removeFile,
} from './actions';

import {Item, Column, Row, ActionMenu} from 'core/ui/components/List';

interface IFile {
    _id: string;
    title: string;
    mimetype: string;
    filename: string;
    description: string;
    media: {
        length: number;
    };
}

interface IProps {
    files: Array<IFile>;
    isLocked: boolean;
    fileicon: (mimetype: string) => string;
    filesize: (size: number) => string;

    editFile: (file: IFile) => void;
    download: (file: IFile) => void;
    removeFile: (file: IFile) => void;
}

class AttachmentsList extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);
        this.renderFile = this.renderFile.bind(this);
    }

    renderFile(file: IFile) {
        const {isLocked, fileicon, filesize,
            download: _download, editFile: _editFile, removeFile: _removeFile,
        } = this.props;

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
                {files.length &&
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

export default connect(mapStateToProps, mapDispatchToProps)(AttachmentsList);
