import React from 'react';
import {connect} from 'react-redux';
import {gettext} from 'core/utils';

import {
    Item, ListItemColumn, ListItemRow
} from 'core/ui/components/List/Item';

import {
    editFile,
    download,
    removeFile,
} from './actions';
import { ActionMenu } from 'core/ui/components/List';

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
                <ListItemColumn border={true} title={file.mimetype}>
                    <i className={`big-icon--${fileicon(file.mimetype)}`}></i>
                </ListItemColumn>
                <ListItemColumn grow={true}>
                    <ListItemRow>
                        <h4>{file.title}</h4>
                    </ListItemRow>
                    <ListItemRow>
                        <h5>{file.filename} {`(${filesize(file.media.length)})`}</h5>
                    </ListItemRow>
                    <ListItemRow>
                        <div className="description">{file.description}</div>
                    </ListItemRow>
                </ListItemColumn>
                <ActionMenu row={true}>
                    <button className="dropdown__toggle"
                        onClick={() => _download(file)}
                        title={gettext('Download')}>
                        <i className="icon-download"></i>
                    </button>
                    {!isLocked && <button className="dropdown__toggle"
                        onClick={() => _editFile(file)}
                        title={gettext('Edit')}>
                        <i className="icon-pencil"></i>
                    </button>}
                    <button className="dropdown__toggle"
                        onClick={() => _removeFile(file)}
                        title={gettext('Remove')}>
                        <i className="icon-trash"></i>
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
