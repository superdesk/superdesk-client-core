/* eslint-disable react/no-multi-comp */

import * as React from 'react';

import {AttachmentsList} from './AttachmentsList';
import {AttachmentsEditorModal} from './AttachmentsEditorModal';

import {showModal} from 'core/services/modalService';

import {gettext} from 'core/utils';
import {IAttachment, IAttachmentsWidgetProps} from 'superdesk-api';
import {appConfig} from 'appConfig';

import {attachmentsApi} from './attachmentsService';
import {showUploadAttachmentsModal} from './UploadAttachmentsModal';

export class AttachmentsWidgetComponent extends React.PureComponent<IAttachmentsWidgetProps> {
    fileInputNode: React.RefObject<HTMLInputElement>;

    constructor(props: IAttachmentsWidgetProps) {
        super(props);

        this.fileInputNode = React.createRef<HTMLInputElement>();

        this.showFileUploadModal = this.showFileUploadModal.bind(this);
        this.onAddFiles = this.onAddFiles.bind(this);
        this.onDragFiles = this.onDragFiles.bind(this);
        this.onDropFiles = this.onDropFiles.bind(this);
        this.editAttachment = this.editAttachment.bind(this);
    }

    showFileUploadModal() {
        if (this.fileInputNode.current != null) {
            this.fileInputNode.current.click();
        }
    }

    onAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        this.showUploadModal(Array.from(event.target.files ?? []));
        event.target.value = null; // reset to allow selecting same file again
    }

    onDragFiles(event: React.DragEvent<HTMLDivElement>) {
        // Prevents Browser default action, such as open in new tab
        event.preventDefault();
    }

    onDropFiles(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        this.showUploadModal(Array.from(event.dataTransfer.files));
    }

    showUploadModal(files: Array<File>) {
        if (this.props.isUploadValid(files) === true) {
            showUploadAttachmentsModal({
                files: files,
                onUploaded: (attachments: Array<IAttachment>) => {
                    this.props.addAttachments(attachments);
                },
            });
        }
    }

    editAttachment(attachment: IAttachment) {
        showModal(({closeModal}) => (
            <AttachmentsEditorModal
                closeEdit={closeModal}
                attachment={attachment}
                saveAttachment={(original, updates) => {
                    attachmentsApi.save(original, updates)
                        .then((updated) => {
                            this.props.updateAttachment(updated);
                            closeModal();
                        });
                }}
            />
        ));
    }

    render() {
        const showUpload = this.props.attachments.length < appConfig.attachments_max_files &&
            this.props.isLockedByMe &&
            !this.props.readOnly;

        return (
            <div
                className="attachments-pane"
                onDragOver={this.onDragFiles}
                onDrop={this.onDropFiles}
            >
                <AttachmentsList
                    attachments={this.props.attachments}
                    readOnly={this.props.readOnly}
                    editAttachment={this.editAttachment}
                    removeAttachment={this.props.removeAttachment}
                />

                {showUpload && (
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
