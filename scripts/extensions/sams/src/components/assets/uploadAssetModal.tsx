// External modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, ASSET_STATE, IAssetItem} from '../../interfaces';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {getActiveSets} from '../../store/sets/selectors';

// API
import {getSamsAPIs} from '../../api';

// UI
import {IModalSize} from '../../ui/modal';
import {showModalConnectedToStore} from '../../utils/ui';
import {getAssetGridItemComponent} from './assetGridItem';
import {getAssetEditorPanel} from './assetEditorPanel';
import {getFileUploadModalComponent} from '../../containers/FileUploadModal';

interface IProps {
    closeModal(): void;
    sets: Array<ISetItem>;
    dark?: boolean;
    modalSize?: IModalSize;
}

interface IState {
    assets?: Dictionary<string, Partial<IAssetItem>>;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getActiveSets(state),
});

export function getShowUploadAssetModalFunction(superdesk: ISuperdesk, props?: Partial<IProps>) {
    const UploadAssetModal = getShowUploadAssetModalComponent(superdesk);

    return () => showModalConnectedToStore<Partial<IProps>>(
        superdesk,
        UploadAssetModal,
        {
            dark: true,
            modalSize: 'fill',
            ...props ?? {},
        },
    );
}

export function getShowUploadAssetModalComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    const AssetGridItem = getAssetGridItemComponent(superdesk);
    const AssetEditorPanel = getAssetEditorPanel(superdesk);
    const samsApi = getSamsAPIs(superdesk);
    const FileUploadDialog = getFileUploadModalComponent<Partial<IAssetItem>>(superdesk);

    class UploadAssetModal extends React.Component<IProps, IState> {
        onFieldChanged: Dictionary<string, (field: string, value: string) => void>;

        constructor(props: IProps) {
            super(props);

            this.state = {
                assets: {},
            };

            this.onFileAdded = this.onFileAdded.bind(this);
            this.onFileRemoved = this.onFileRemoved.bind(this);
            this.uploadFile = this.uploadFile.bind(this);
            this.renderGridItem = this.renderGridItem.bind(this);
            this.renderRightPanel = this.renderRightPanel.bind(this);

            this.onFieldChanged = {};
        }

        onFileAdded(id: string, file: File) {
            this.setState((state: IState) => ({
                assets: {
                    ...state.assets,
                    [id]: {
                        _id: id,
                        state: ASSET_STATE.DRAFT,
                        filename: file.name,
                        length: file.size,
                        mimetype: file.type,
                        name: file.name,
                        description: '',
                        set_id: this.props.sets[0]._id,
                    },
                },
            }));

            this.onFieldChanged[id] = this.onChange.bind(this, id);
        }

        onFileRemoved(id: string) {
            this.setState((state: IState) => {
                const assets = {...state.assets};

                delete assets[id];

                return {assets: assets};
            });

            delete this.onFieldChanged[id];
        }

        uploadFile(item, onProgress) {
            const data = new FormData();
            const asset = this.state.assets[item.id];

            data.append('binary', item.binary, asset.filename);
            Object.keys(asset)
                .forEach((field) => {
                    if (['_id', 'length'].includes(field) === false) {
                        data.append(field, asset[field]);
                    }
                });

            return samsApi.assets.upload(data, onProgress);
        }

        onChange(id, field, value) {
            this.setState((state: IState) => {
                const assets = {...state.assets};

                assets[id][field] = value;

                return {assets: assets};
            });
        }

        renderGridItem({item, asset, selected, selectFile, removeFile}) {
            return (
                <AssetGridItem
                    asset={asset}
                    onClick={selectFile}
                    selected={selected}
                    remove={removeFile}
                    uploadProgress={item.uploadProgress}
                    error={item.error}
                />
            );
        }

        renderRightPanel({item, submitting}) {
            return (
                <AssetEditorPanel
                    key={item.id}
                    asset={this.state.assets[item.id]}
                    disabled={submitting}
                    onChange={this.onFieldChanged[item.id]}
                    sets={this.props.sets}
                />
            );
        }

        render() {
            return (
                <FileUploadDialog
                    dark={true}
                    modalSize="fill"
                    multiple={true}
                    closeModal={this.props.closeModal}
                    title={gettext('Upload New Asset(s)')}
                    onFileAdded={this.onFileAdded}
                    onFileRemoved={this.onFileRemoved}
                    uploadFile={this.uploadFile}
                    assets={this.state.assets}
                    ListItemComponent={this.renderGridItem}
                    RightPanelComponent={this.renderRightPanel}
                />
            );
        }
    }

    return connect(mapStateToProps)(UploadAssetModal);
}
