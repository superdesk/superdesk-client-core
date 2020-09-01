// External modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {ISuperdesk} from 'superdesk-api';
import {ISetItem, ASSET_STATE, IAssetItem} from '../../interfaces';
import {IApplicationState} from '../../store';
import {IUploadItem, IUploadFileListItemProps, IContentPanelProps} from '../../containers/FileUploadModal';

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
    assets: Dictionary<string, Partial<IAssetItem>>;
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
    const {notify} = superdesk.ui;

    const AssetGridItem = getAssetGridItemComponent(superdesk);
    const AssetEditorPanel = getAssetEditorPanel(superdesk);
    const samsApi = getSamsAPIs(superdesk);
    const FileUploadDialog = getFileUploadModalComponent<Partial<IAssetItem>>(superdesk);

    class UploadAssetModal extends React.Component<IProps, IState> {
        onFieldChanged: Dictionary<string, (field: keyof IAssetItem, value: string) => void>;

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
                const assets: IState['assets'] = {...state.assets};

                delete assets[id];

                return {assets: assets};
            });

            delete this.onFieldChanged[id];
        }

        uploadFile(item: IUploadItem, onProgress: (event: ProgressEvent) => void): Promise<Partial<IAssetItem>> {
            const data = new FormData();
            const asset = this.state.assets?.[item.id];

            if (asset == null) {
                notify.error(gettext('Unable to find Asset associated with the file!'));
                return Promise.reject();
            }

            data.append('binary', item.binary, asset.filename);
            let field: keyof IAssetItem;

            for (field in asset) {
                if (['_id', 'length'].includes(field) === false) {
                    data.append(field, asset[field] as string);
                }
            }

            return samsApi.assets.upload(data, onProgress);
        }

        onChange(id: string, field: keyof IAssetItem, value: any) {
            this.setState((state: IState) => {
                const assets: IState['assets'] = {...state.assets};

                assets[id][field] = value;

                return {assets: assets};
            });
        }

        renderGridItem({item, asset, selected, selectFile, removeFile}: IUploadFileListItemProps<Partial<IAssetItem>>) {
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

        renderRightPanel({item, submitting}: IContentPanelProps) {
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
