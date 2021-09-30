// External Modules
import * as React from 'react';

// Types
import {IAssetItem} from '../../interfaces';
import {superdeskApi} from '../../apis';

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
} from '../../utils/ui';
import {getMimetypeHumanReadable} from '../../utils/assets';

interface IProps {
    asset?: IAssetItem;
    closeModal(): void;
}

export function showImagePreviewModal(asset: IAssetItem) {
    return showModalConnectedToStore(AssetImagePreviewFullScreen, {asset: asset});
}

export class AssetImagePreviewFullScreen extends React.Component<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {config} = superdeskApi.instance;
        const ContentPreview = getPreviewComponent(this.props.asset!);
        const typeIcon = getIconTypeFromMimetype(
            this.props.asset?.mimetype ?? 'text',
        );

        return (
            <Modal
                id="AssetImagePreviewFullscreenModal"
                size="fullscreen"
                closeModal={this.props.closeModal}
                closeOnEsc={true}
            >
                <PageLayout
                    mainClassName="sd-padding--2"
                    main={!ContentPreview ? null : (
                        <AssetImageRendition
                            asset={this.props.asset!}
                            rendition={config.media?.renditions?.sams?.viewImage}
                            style={{
                                minWidth: '100%',
                                minHeight: '100%',
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
                                                <FormLabel text={gettext('Image Dimensions')} style="light" />
                                                <Text>{getAssetStateLabel(this.props.asset?.state!)}</Text>
                                            </FormRow>

                                            <FormRow>
                                                <FormLabel text={gettext('State')} style="light" />
                                                <Text>{getAssetStateLabel(this.props.asset?.state!)}</Text>
                                            </FormRow>

                                            <FormRow>
                                                <FormLabel text={gettext('Set')} style="light" />
                                                <Text>{this.props.asset?.name}</Text>
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
