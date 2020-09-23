/* eslint-disable react/no-multi-comp */

import * as React from 'react';
import {Provider, connect} from 'react-redux';

import {AttachmentsList} from './AttachmentsList';
import {AttachmentsEditorModal} from './AttachmentsEditorModal';

import {showModal} from 'core/services/modalService';

import {
    editFile,
    download,
    removeFile,
    selectFiles,
    saveFile,
} from './actions';

import {gettext} from 'core/utils';
import {IAttachment, IAttachmentsWidgetProps} from 'superdesk-api';

import {CC} from 'core/ui/configurable-ui-components';

export class AttachmentsWidgetComponent extends React.PureComponent<IAttachmentsWidgetProps> {
    fileInputNode: React.RefObject<HTMLInputElement>;

    constructor(props: IAttachmentsWidgetProps) {
        super(props);

        this.fileInputNode = React.createRef<HTMLInputElement>();

        this.showFileUploadModal = this.showFileUploadModal.bind(this);
        this.onAddFiles = this.onAddFiles.bind(this);
        this.onDragFiles = this.onDragFiles.bind(this);
        this.onDropFiles = this.onDropFiles.bind(this);
        this.editFile = this.editFile.bind(this);
    }

    showFileUploadModal() {
        if (this.fileInputNode.current != null) {
            this.fileInputNode.current.click();
        }
    }

    onAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.props.selectFiles(Array.from(event.target.files ?? []));
    }

    onDragFiles(event: React.DragEvent<HTMLDivElement>) {
        // Prevents Browser default action, such as open in new tab
        event.preventDefault();
    }

    onDropFiles(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        this.props.selectFiles(Array.from(event.dataTransfer.files));
    }

    editFile(file: IAttachment) {
        showModal(({closeModal}) => (
            <AttachmentsEditorModal
                closeEdit={closeModal}
                file={file}
                saveFile={(original, updates) => {
                    this.props.saveFile(original, updates);
                    closeModal();
                }}
            />
        ));
    }

    render() {
        if (CC.AuthoringAttachmentsWidget != null) {
            return (
                <CC.AuthoringAttachmentsWidget {...this.props} />
            );
        }

        const showUpload = this.props.files.length < this.props.maxFiles &&
            this.props.isLockedByMe &&
            !this.props.readOnly;

        return (
            <div
                className="attachments-pane"
                onDragOver={this.onDragFiles}
                onDrop={this.onDropFiles}
            >
                <AttachmentsList
                    files={this.props.files}
                    readOnly={this.props.readOnly}
                    editFile={this.editFile}
                    download={this.props.download}
                    removeFile={this.props.removeFile}
                />

                {!(showUpload && this.props.isWidget === true) ? null : (
                    <div className="attach-indicator">
                        <div className="round-box">
                            <i className="big-icon--upload-alt icon" />
                        </div>

                        <div className="subtext">
                            {gettext('Drag one or more files here to upload them, or just click the button below.')}
                        </div>

                        <button
                            className="btn btn--hollow"
                            disabled={this.props.readOnly || this.props.editable === false}
                            onClick={this.showFileUploadModal}
                        >
                            {gettext('Attach files')}
                        </button>
                    </div>
                )}

                {!(showUpload && this.props.isWidget === false) ? null : (
                    <button
                        className="item-association"
                        disabled={this.props.readOnly || this.props.editable === false}
                        onClick={this.showFileUploadModal}
                    >
                        <div className="subtext">
                            <i className="icon-attachment-large" />
                            <span>
                                {gettext('Drag one or more files here to upload them, or just click here.')}
                            </span>
                        </div>
                    </button>
                )}

                <input
                    type="file"
                    ref={this.fileInputNode}
                    onChange={this.onAddFiles}
                    multiple={true}
                    style={{visibility: 'hidden'}}
                />
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => ({
    files: state.attachments.files,
    readOnly: state.editor.isLocked || ownProps.readOnly === true,
    edit: state.attachments.edit,
    maxSize: state.attachments.maxSize,
    maxFiles: state.attachments.maxFiles,
    editable: state.editor.editable,
    isLocked: state.editor.isLocked,
    isLockedByMe: state.editor.isLockedByMe,
});

const mapDispatchToProps = {
    editFile,
    download,
    removeFile,
    selectFiles,
    saveFile,
};

const AttachmentsWidgetConnected = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AttachmentsWidgetComponent);

interface IProps {
    store: any;
    readOnly: boolean;
    isWidget: boolean;
}

export class AttachmentsWidget extends React.PureComponent<IProps> {
    render() {
        return (
            <Provider store={this.props.store}>
                <AttachmentsWidgetConnected
                    readOnly={this.props.readOnly}
                    isWidget={this.props.isWidget}
                />
            </Provider>
        );
    }
}
