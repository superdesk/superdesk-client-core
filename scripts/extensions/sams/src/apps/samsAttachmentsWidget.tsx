import * as React from 'react';
import {Store} from 'redux';
import classNames from 'classnames';

import {IAttachmentsWidgetProps, ISuperdesk} from 'superdesk-api';
import {ASSET_STATE, IAssetItem} from '../interfaces';

import {SamsAttachmentsList} from '../components/authoring/attachments/samsAttahcmentsList';
import {getShowUploadAssetModalFunction, IUploadAssetModalProps} from '../components/assets/uploadAssetModal';
import {loadStorageDestinations} from '../store/storageDestinations/actions';
import {loadSets} from '../store/sets/actions';

export function onAttachmentsWidgetInit(store: Store): Promise<any> {
    return Promise.all([
        store.dispatch<any>(loadStorageDestinations()),
        store.dispatch<any>(loadSets()),
    ]);
}

export function getSamsAttachmentsWidget(superdesk: ISuperdesk): React.ComponentType<IAttachmentsWidgetProps> {
    const {gettext} = superdesk.localization;
    const {download} = superdesk.entities.attachment;

    function showUploadAssetModal(props?: Partial<IUploadAssetModalProps>) {
        return getShowUploadAssetModalFunction(superdesk, props)();
    }

    return class SamsAttachmentsWidget extends React.PureComponent<IAttachmentsWidgetProps> {
        fileInputNode: React.RefObject<HTMLInputElement>;

        constructor(props: IAttachmentsWidgetProps) {
            super(props);

            this.fileInputNode = React.createRef<HTMLInputElement>();

            this.onAddFiles = this.onAddFiles.bind(this);
            this.onDragFiles = this.onDragFiles.bind(this);
            this.onDropFiles = this.onDropFiles.bind(this);
        }

        onAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
            event.preventDefault();
        }

        onDragFiles(event: React.DragEvent<HTMLDivElement>) {
            // Prevents Browser default action, such as open in new tab
            event.preventDefault();
        }

        onDropFiles(event: React.DragEvent<HTMLDivElement>) {
            event.preventDefault();

            if (!this.props.isUploadValid(Array.from(event.dataTransfer.files))) {
                return;
            }

            showUploadAssetModal({
                initialFiles: Array.from(event.dataTransfer.files)
                    .map((file) => ({
                        id: Math.random().toString(36).substr(1),
                        file: file,
                    })),
                onAssetUploaded: (asset: IAssetItem) => {
                    this.props.addAttachments([{
                        _id: asset._id,
                        title: asset.name,
                        description: asset.description,
                        filename: asset.filename,
                        mimetype: asset.mimetype,
                        internal: asset.state !== ASSET_STATE.PUBLIC,
                        media: {
                            _id: asset._id,
                            md5: asset._etag,
                            name: asset.name,
                            filename: asset.filename,
                            content_type: asset.mimetype,
                            length: asset.length,
                        },
                    }]);
                },
            });
        }

        render() {
            const containerClasses = classNames({
                'widget-content__main': this.props.isWidget === true,
                'sd-padding--2': this.props.isWidget === true,
            });

            return (
                <React.Fragment>
                    <div
                        className={containerClasses}
                        onDragOver={this.onDragFiles}
                        onDragEnter={this.onDragFiles}
                        onDrop={this.onDropFiles}
                    >
                        <SamsAttachmentsList
                            files={this.props.attachments}
                            readOnly={this.props.readOnly}
                            editFile={() => false}
                            download={download}
                            removeFile={this.props.removeAttachment}
                        />
                    </div>
                    <div
                        className="widget-content__footer"
                        onDragOver={this.onDragFiles}
                        onDrop={this.onDropFiles}
                    >
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
                                onClick={showUploadAssetModal}
                            >
                                {gettext('Attach files')}
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={this.fileInputNode}
                            onChange={this.onAddFiles}
                            multiple={true}
                            style={{visibility: 'hidden'}}
                        />
                    </div>
                </React.Fragment>
            );
        }
    };
}
