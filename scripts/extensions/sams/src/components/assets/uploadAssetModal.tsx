// External modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {ASSET_STATE, IAssetItem, IUploadAssetModalProps} from '../../interfaces';
import {IApplicationState} from '../../store';
import {samsApi, superdeskApi} from '../../apis';

// Redux Actions & Selectors
import {getActiveSets} from '../../store/sets/selectors';

// UI
import {AssetGridItem} from './assetGridItem';
import {AssetEditorPanel} from './assetEditorPanel';
import {
    FileUploadModal,
    IContentPanelProps,
    IUploadFileListItemProps,
    IUploadItem,
} from '../../containers/FileUploadModal';

interface IState {
    assets: Dictionary<string, Partial<IAssetItem>>;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getActiveSets(state),
});

export class UploadAssetModalComponent extends React.Component<IUploadAssetModalProps, IState> {
    onFieldChanged: Dictionary<string, (field: keyof IAssetItem, value: string) => void>;

    constructor(props: IUploadAssetModalProps) {
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

        return samsApi.assets.upload(data, onProgress);
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
        const {gettext} = superdeskApi.localization;

        return (
            <FileUploadModal
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

export const UploadAssetModal = connect(mapStateToProps)(UploadAssetModalComponent);
