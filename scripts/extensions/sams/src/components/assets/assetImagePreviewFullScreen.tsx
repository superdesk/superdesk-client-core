/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

// External Modules
import * as React from 'react';
import {connect} from 'react-redux';

// Types
import {IAssetItem, ISetItem, RENDITION} from '../../interfaces';
import {superdeskApi} from '../../apis';
import {IApplicationState} from '../../store';

// Redux Actions & Selectors
import {getSets} from '../../store/sets/selectors';

// UI
import {Icon, Label, FormLabel} from 'superdesk-ui-framework/react';
import {
    FormRow,
    Modal,
    PanelContent,
    PanelContentBlock,
    PanelContentBlockInner,
    PanelHeader,
    Text,
} from '../../ui';
import {AssetImageRendition} from './AssetImageRendition';
import {getPreviewComponent} from './preview';
import {ToggleBoxNext} from 'superdesk-ui-framework';
import {VersionUserDateLines} from '../common/versionUserDateLines';
import {PageLayout} from '../../containers/PageLayout';

// Utils
import {
    getAssetStateLabel,
    getIconTypeFromMimetype,
    getHumanReadableFileSize,
    showModalConnectedToStore,
    getAssetRenditionDimension,
} from '../../utils/ui';
import {getMimetypeHumanReadable} from '../../utils/assets';

interface IProps {
    asset?: IAssetItem;
    sets: Array<ISetItem>;
    closeModal(): void;
}

const mapStateToProps = (state: IApplicationState) => ({
    sets: getSets(state),
});

export function showImagePreviewModal(asset: Partial<IAssetItem>) {
    return showModalConnectedToStore(AssetImagePreviewFullScreen, {asset: asset});
}

export class AssetImagePreviewFullScreenComponent extends React.Component<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const ContentPreview = getPreviewComponent(this.props.asset!);
        const typeIcon = getIconTypeFromMimetype(
            this.props.asset?.mimetype ?? 'text',
        );
        const setName = this.props.sets!.find((set) => set._id === this.props.asset!.set_id)?.name!;

        return (
            <Modal
                id="AssetImagePreviewFullscreenModal"
                size="fullscreen"
                closeModal={this.props.closeModal}
                closeOnEsc={true}
            >
                <PageLayout
                    mainClassName="sd-padding--2"
                    mainProps={{
                        style: {
                            justifyContent: 'space-around',
                            display: 'flex',
                        },
                    }}
                    main={!ContentPreview ? null : (
                        <AssetImageRendition
                            asset={this.props.asset!}
                            rendition={this.props.asset?.renditions.find((r) =>
                                r?.name === RENDITION.ORIGINAL)?.params!}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                height: 'auto',
                                margin: 'auto',
                                pointerEvents: 'none',
                                transition: 'filter ease-in-out 0.3s',
                            }}
                            container={(loading, children) => (
                                <div
                                    className="asset-preview__image"
                                    style={!loading ? undefined : {
                                        width: '100%',
                                        height: '250px',
                                        position: 'relative',
                                        backgroundColor: '#2c2c2c',
                                    }}
                                >
                                    {children}
                                </div>
                            )}
                        />
                    )}
                    rightPanelOpen={true}
                    rightPanel={(
                        <React.Fragment>
                            <PanelHeader
                                onClose={this.props.closeModal}
                                borderB={true}
                                title={gettext('Image Preview')}
                            />
                            <PanelContent>
                                <PanelContentBlock flex={true}>
                                    <PanelContentBlockInner grow={true}>
                                        <VersionUserDateLines item={this.props.asset!} />
                                        <Icon
                                            name={typeIcon}
                                            className="sd-grid-item__type-icn sd-grid-item__footer-block-item"
                                        />
                                        <ToggleBoxNext title="Details" isOpen={true}>
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
                                                <Text>{getHumanReadableFileSize(this.props.asset?.length!)}</Text>
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
                                                <Text>{getAssetStateLabel(this.props.asset?.state!)}</Text>
                                            </FormRow>

                                            <FormRow>
                                                <FormLabel text={gettext('Dimensions')} style="light" />
                                                <Text>
                                                    {getAssetRenditionDimension(this.props.asset!, RENDITION.ORIGINAL)}
                                                </Text>
                                            </FormRow>

                                            <FormRow>
                                                <FormLabel text={gettext('Set')} style="light" />
                                                <Text>{setName}</Text>
                                            </FormRow>

                                            <FormRow>
                                                <FormLabel text={gettext('Tags')} style="light" />
                                                {this.props.asset?.tags?.map((tag) => (
                                                    <Label
                                                        key={this.props.asset?.tags.indexOf(tag)}
                                                        text={tag.name}
                                                        style="translucent"
                                                        size="large"
                                                    />
                                                ))}
                                            </FormRow>

                                        </ToggleBoxNext>
                                    </PanelContentBlockInner>
                                </PanelContentBlock>
                            </PanelContent>
                        </React.Fragment>
                    )}
                />
            </Modal>
        );
    }
}

export const AssetImagePreviewFullScreen = connect(
    mapStateToProps,
)(AssetImagePreviewFullScreenComponent);
