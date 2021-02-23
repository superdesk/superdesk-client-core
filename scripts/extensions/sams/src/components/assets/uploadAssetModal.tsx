// External modules
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';

// Types
import {ASSET_STATE, IAssetItem, IUploadAssetModalProps, LIST_ACTION} from '../../interfaces';
import {IApplicationState} from '../../store';
import {samsApi, superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {getActiveSets} from '../../store/sets/selectors';
import {queryAssetsFromCurrentSearch} from '../../store/assets/actions';

// UI
import {
    FileUploadModal,
    IContentPanelProps,
    IUploadFileListItemProps,
    IUploadItem,
} from '../../containers/FileUploadModal';
import {AssetGridItem} from './assetGridItem';
import {AssetEditor} from './assetEditor';

interface IState {
    assets: Dictionary<string, Partial<IAssetItem>>;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getActiveSets(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    queryAssetsFromCurrentSearch: (listAction?: LIST_ACTION) => dispatch<any>(queryAssetsFromCurrentSearch(listAction)),
});

export class UploadAssetModalComponent extends React.Component<IUploadAssetModalProps, IState> {
    onFieldChanged: Dictionary<string, (field: keyof IAssetItem, value: string) => void>;

    constructor(props: IUploadAssetModalProps) {
        super(props);

        this.onFieldChanged = {};
        this.state = {
            assets: this.getInitialAssets(),
        };

        this.onFileAdded = this.onFileAdded.bind(this);
        this.onFileRemoved = this.onFileRemoved.bind(this);
        this.uploadFile = this.uploadFile.bind(this);
        this.renderGridItem = this.renderGridItem.bind(this);
        this.renderRightPanel = this.renderRightPanel.bind(this);
        this.closeModal = this.closeModal.bind(this);
    }

    getInitialAssets(): Dictionary<string, Partial<IAssetItem>> {
        const assets: Dictionary<string, Partial<IAssetItem>> = {};

        if (this.props.initialFiles != null && this.props.initialFiles?.length > 0) {
            this.props.initialFiles.forEach(
                (item) => {
                    assets[item.id] = {
                        _id: item.id,
                        state: ASSET_STATE.DRAFT,
                        filename: item.file.name,
                        length: item.file.size,
                        mimetype: item.file.type,
                        name: item.file.name,
                        description: '',
                        set_id: this.props.sets[0]._id,
                    };
                    this.onFieldChanged[item.id] = this.onChange.bind(this, item.id);
                },
            );
        }

        return assets;
    }

    closeModal() {
        this.props.queryAssetsFromCurrentSearch(LIST_ACTION.REPLACE);

        if (this.props.onModalClosed != null) {
            this.props.onModalClosed();
        }

        this.props.closeModal();
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
        const {gettext} = superdeskApi.localization;
        const {notify} = superdeskApi.ui;

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

        return samsApi.assets.upload(data, onProgress)
            .then((newAsset) => {
                if (this.props.onAssetUploaded != null) {
                    return this.props.onAssetUploaded(newAsset)
                        .then(() => newAsset);
                }

                return newAsset;
            });
    }

    onChange(id: string, field: keyof IAssetItem, value: any) {
        this.setState((state: IState) => {
            const assets: IState['assets'] = {...state.assets};

            assets[id] = {
                ...assets[id],
                [field]: value,
            };

            return {assets: assets};
        });
    }

    renderGridItem({item, asset, selected, selectFile, removeFile}: IUploadFileListItemProps<Partial<IAssetItem>>) {
        return (
            <AssetGridItem
                asset={asset}
                onClick={selectFile}
                onDoubleClick={selectFile}
                selected={selected}
                remove={removeFile}
                uploadProgress={item.uploadProgress}
                error={item.error}
            />
        );
    }

    renderRightPanel({item, submitting}: IContentPanelProps) {
        return (
            <AssetEditor
                key={item.id}
                asset={this.state.assets[item.id]}
                disabled={submitting}
                onChange={this.onFieldChanged[item.id]}
            />
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <FileUploadModal
                dark={true}
                modalSize="fill"
                initialFiles={this.props.initialFiles}
                multiple={true}
                closeModal={this.closeModal}
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

export const UploadAssetModal = connect(mapStateToProps, mapDispatchToProps)(UploadAssetModalComponent);
