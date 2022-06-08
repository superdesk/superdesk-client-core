/* eslint-disable react/no-multi-comp */

// External Modules
import * as React from 'react';
import {Dispatch} from 'redux';
import classNames from 'classnames';
import {connect} from 'react-redux';

// Types
import {IAttachment, IAttachmentsWidgetProps} from 'superdesk-api';
import {ASSET_STATE, IAssetItem, IAssetSearchParams, ISetItem, IUploadAssetModalProps} from '../interfaces';
import {IApplicationState} from '../store';
import {superdeskApi, samsApi} from '../apis';

// Redux Actions & Selectors
import {pushAssetSearchParams, popAssetSearchParams} from '../store/assets/actions';
import {getSetsById, getAvailableSetsForDesk} from '../store/sets/selectors';

// UI
import {Button} from 'superdesk-ui-framework/react';
import {SamsApp} from './samsApp';
import {SamsAttachmentsList} from '../components/attachments/samsAttachmentsList';
import {showEditAttachmentModal} from '../components/attachments/editAttachmentModal';
import {showSelectAssetModal} from '../components/assets/selectAssetModal';

export class SamsAttachmentsWidget<T extends IAttachmentsWidgetProps> extends React.PureComponent<T> {
    render() {
        return (
            <SamsApp>
                <SamsAttachmentsWidgetComponentConnected {...this.props} />
            </SamsApp>
        );
    }
}

interface IProps extends IAttachmentsWidgetProps {
    activeSetIds: Array<ISetItem['_id']>;
    setsById: Dictionary<string, ISetItem>;
    pushSearchParams(params: Partial<IAssetSearchParams>): void;
    popSearchParams(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    activeSetIds: getAvailableSetsForDesk(state),
    setsById: getSetsById(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    pushSearchParams: (params: Partial<IAssetSearchParams>) => dispatch<any>(pushAssetSearchParams(params)),
    popSearchParams: () => dispatch<any>(popAssetSearchParams()),
});

class SamsAttachmentsWidgetComponent extends React.PureComponent<IProps> {
    fileInputNode: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.fileInputNode = React.createRef<HTMLInputElement>();

        this.onAddFiles = this.onAddFiles.bind(this);
        this.onDragFiles = this.onDragFiles.bind(this);
        this.onDropFiles = this.onDropFiles.bind(this);

        this.showUploadAssetModal = this.showUploadAssetModal.bind(this);
        this.showEditAssetModal = this.showEditAssetModal.bind(this);
        this.showSelectAssetModal = this.showSelectAssetModal.bind(this);
    }

    onAddFiles(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
    }

    onDragFiles(event: React.DragEvent<HTMLDivElement>) {
        // Prevents Browser default action, such as open in new tab
        event.preventDefault();
    }

    showUploadAssetModal(props: Partial<IUploadAssetModalProps> = {}) {
        return samsApi.assets.showUploadModal({
            defaultAssetState: ASSET_STATE.PUBLIC,
            allowedStates: [ASSET_STATE.INTERNAL, ASSET_STATE.PUBLIC],
            onAssetUploaded: (asset: IAssetItem) => {
                return superdeskApi.entities.attachment.create({
                    media: asset._id,
                    title: asset.name,
                    description: asset.description,
                    internal: asset.state !== ASSET_STATE.PUBLIC,
                })
                    .then((attachment) => {
                        this.props.addAttachments([attachment]);
                    });
            },
            ...props,
        });
    }

    showEditAssetModal(attachment: IAttachment) {
        showEditAttachmentModal(attachment)
            .then(([updatedAttachment, _updatedAsset]) => {
                this.props.updateAttachment(updatedAttachment);
            });
    }

    showSelectAssetModal() {
        this.props.pushSearchParams({
            sizeTo: superdeskApi.instance.config.attachments_max_size / 1048576, // bytes -> MB
            states: [ASSET_STATE.PUBLIC, ASSET_STATE.INTERNAL],
            setIds: this.props.activeSetIds,
            excludedAssetIds: this.props.attachments.map((attachment) => (
                typeof attachment.media === 'string' ?
                    attachment.media :
                    attachment.media._id
            )),
        });

        showSelectAssetModal()
            .then((selectedAssets: Dictionary<string, IAssetItem>) => {
                Promise.all(Object.keys(selectedAssets).map((assetId) => {
                    const asset = selectedAssets[assetId];

                    return superdeskApi.entities.attachment.create({
                        media: asset._id,
                        title: asset.name,
                        description: asset.description,
                        internal: asset.state !== ASSET_STATE.PUBLIC,
                    });
                }))
                    .then((attachments: Array<IAttachment>) => {
                        this.props.addAttachments(attachments);
                    });
            })
            .finally(() => {
                this.props.popSearchParams();
            });
    }

    onDropFiles(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();

        if (!this.props.isUploadValid(Array.from(event.dataTransfer.files))) {
            return;
        }

        this.showUploadAssetModal({
            initialFiles: Array.from(event.dataTransfer.files)
                .map((file) => ({
                    id: Math.random().toString(36).substr(1),
                    file: file,
                })),
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {download} = superdeskApi.entities.attachment;

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
                        sets={this.props.setsById}
                        readOnly={this.props.readOnly ?? false}
                        editFile={this.showEditAssetModal}
                        download={download}
                        removeFile={this.props.removeAttachment}
                    />
                </div>
                <div
                    className="widget-content__footer"
                    onDragOver={this.onDragFiles}
                    onDrop={this.onDropFiles}
                >
                    {this.props.isWidget === true ? (
                        <div className="form__row">
                            <div className="basic-drag-block">
                                <i className="big-icon--upload-alt" />
                                {this.props.readOnly ? null : (
                                    <React.Fragment>
                                        <span className="basic-drag-block__text">
                                            {gettext('Drag files here or')}
                                        </span>
                                        <a className="text-link link" onClick={() => this.showUploadAssetModal()}>
                                            &nbsp;{gettext('browse')}
                                        </a>
                                        <div>
                                            <Button
                                                text={gettext('Or select an existing asset')}
                                                onClick={this.showSelectAssetModal}
                                                style="hollow"
                                            />
                                        </div>
                                    </React.Fragment>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="form__row">
                            <div className="basic-drag-block">
                                <i className="big-icon--upload-alt" />
                                {this.props.readOnly ? null : (
                                    <React.Fragment>
                                        <div>
                                            <span className="basic-drag-block__text">
                                                {gettext('Drag files here or')}
                                            </span>
                                            <a className="text-link link" onClick={() => this.showUploadAssetModal()}>
                                            &nbsp;{gettext('browse')}
                                            </a>
                                        </div>
                                        <div>
                                            <Button
                                                text={gettext('Or select an existing asset')}
                                                onClick={this.showSelectAssetModal}
                                                style="hollow"
                                            />
                                        </div>
                                    </React.Fragment>
                                )}
                            </div>
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
            </React.Fragment>
        );
    }
}

const SamsAttachmentsWidgetComponentConnected = connect(
    mapStateToProps,
    mapDispatchToProps,
)(SamsAttachmentsWidgetComponent);
