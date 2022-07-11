// External modules
import * as React from 'react';
import {Dispatch} from 'redux';
import {connect} from 'react-redux';

// Types
import {ASSET_ACTIONS, IAssetCallback, IAssetItem, LIST_ACTION} from '../../interfaces';
import {IApplicationState} from '../../store';
import {superdeskApi, samsApi} from '../../apis';

// Redux Actions & Selectors
import {
    closeAssetContentPanel,
    deleteAssets,
    onEditAsset,
    queryAssetsFromCurrentSearch,
    forceUnlockAsset,
} from '../../store/assets/actions';
import {getSelectedAsset, getSetNameForSelectedAsset} from '../../store/assets/selectors';

// UI
import {FormLabel, IconButton, Label, Menu} from 'superdesk-ui-framework/react';
import {
    FormRow,
    PanelContent,
    PanelContentBlock,
    PanelContentBlockInner,
    PanelHeader,
    Text,
} from '../../ui';
import {VersionUserDateLines} from '../common/versionUserDateLines';
import {getPreviewComponent} from './preview';
import {showImagePreviewModal} from './assetImagePreviewFullScreen';

// Utils
import {getHumanReadableFileSize} from '../../utils/ui';
import {getDropdownItemsForActions, getMimetypeHumanReadable} from '../../utils/assets';

interface IProps {
    asset?: IAssetItem;
    setName?: string;
    deleteAsset(asset: IAssetItem): void;
    onEditAsset(asset: IAssetItem): void;
    onPanelClosed(): void;
    downloadAsset(asset: Partial<IAssetItem>): void;
    queryAssetsFromCurrentSearch(listStyle: LIST_ACTION): void;
    forceUnlockAsset(asset: IAssetItem): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    asset: getSelectedAsset(state),
    setName: getSetNameForSelectedAsset(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onEditAsset: (asset: IAssetItem) => dispatch<any>(onEditAsset(asset)),
    deleteAsset: (asset: IAssetItem) => dispatch<any>(deleteAssets(asset)),
    onPanelClosed: () => dispatch(closeAssetContentPanel()),
    queryAssetsFromCurrentSearch: (listAction?: LIST_ACTION) => dispatch<any>(queryAssetsFromCurrentSearch(listAction)),
    forceUnlockAsset: (asset: IAssetItem) => dispatch<any>(forceUnlockAsset(asset)),
});

export function downloadAssetBinary(asset: IAssetItem): void {
    samsApi.assets.getAssetBinary(asset);
}

export class AssetPreviewPanelComponent extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onEditAsset = this.onEditAsset.bind(this);
        this.onDownloadSingleAssetCompressedBinary = this.onDownloadSingleAssetCompressedBinary.bind(this);
        this.onDeleteAsset = this.onDeleteAsset.bind(this);
        this.onAssetImagePreview = this.onAssetImagePreview.bind(this);
    }

    onEditAsset(): void {
        this.props.onEditAsset(this.props.asset!);
    }

    onDeleteAsset(): void {
        this.props.deleteAsset(this.props.asset!);
    }

    onDownloadSingleAssetCompressedBinary(): void {
        downloadAssetBinary(this.props.asset!);
    }

    onAssetImagePreview(asset: IAssetItem): void {
        showImagePreviewModal(asset!);
    }

    render() {
        if (this.props.asset?._id == null) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const actions: Array<IAssetCallback> =
            [{
                action: ASSET_ACTIONS.EDIT,
                onSelect: this.onEditAsset,
            },
            {
                action: ASSET_ACTIONS.DOWNLOAD,
                onSelect: this.onDownloadSingleAssetCompressedBinary,
            },
            {
                action: ASSET_ACTIONS.DELETE,
                onSelect: this.onDeleteAsset,
            },
            {
                action: ASSET_ACTIONS.VIEW_FULL_SCREEN,
                onSelect: this.onAssetImagePreview,
            },
            ];

        if (superdeskApi.privileges.hasPrivilege('sams_manage_assets')) {
            actions.push({
                action: ASSET_ACTIONS.FORCE_UNLOCK,
                onSelect: this.props.forceUnlockAsset,
            });
        }

        const newActions = getDropdownItemsForActions(this.props.asset!, actions);
        const ContentPreview = getPreviewComponent(this.props.asset);

        return (
            <React.Fragment>
                <PanelHeader onClose={this.props.onPanelClosed} borderB={true} title={gettext('Asset Preview')} />
                <PanelContent>
                    <PanelContentBlock flex={true}>
                        <PanelContentBlockInner grow={true}>
                            <VersionUserDateLines item={this.props.asset} />
                        </PanelContentBlockInner>
                        <PanelContentBlockInner right={true}>
                            <Menu items={newActions}>
                                {(toggle) => (
                                    <IconButton
                                        ariaValue="dropdown-more-options"
                                        icon="dots-vertical"
                                        onClick={toggle}
                                    />
                                )}
                            </Menu>
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                    {!ContentPreview ? null : (
                        <PanelContentBlock flex={true}>
                            <PanelContentBlockInner grow={true}>
                                <ContentPreview asset={this.props.asset} />
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    )}
                    <PanelContentBlock flex={true}>
                        <PanelContentBlockInner grow={true}>
                            <FormRow>
                                <FormLabel text={gettext('Name')} style="light" />
                                <Text>{this.props.asset?.name}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Description')} style="light" />
                                <Text>{this.props.asset?.description || '-'}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Filename')} style="light" />
                                <Text>{this.props.asset?.filename}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Size')} style="light" />
                                <Text>{getHumanReadableFileSize(this.props.asset?.length)}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Type')} style="light" />
                                <Text>
                                    {getMimetypeHumanReadable(this.props.asset?.mimetype)}
                                    ({this.props.asset?.mimetype})
                                </Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('State')} style="light" />
                                <Text>{this.props.asset?.state}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Set')} style="light" />
                                <Text>{this.props.setName}</Text>
                            </FormRow>

                            <FormRow>
                                <FormLabel text={gettext('Tags')} style="light" />
                                {this.props.asset.tags?.map((tag) => (
                                    <Label
                                        key={this.props.asset?.tags.indexOf(tag)}
                                        text={tag.name}
                                        style="translucent"
                                        size="large"
                                    />
                                ))}
                            </FormRow>
                        </PanelContentBlockInner>
                    </PanelContentBlock>
                </PanelContent>
            </React.Fragment>
        );
    }
}

export const AssetPreviewPanel = connect(
    mapStateToProps,
    mapDispatchToProps,
)(AssetPreviewPanelComponent);
