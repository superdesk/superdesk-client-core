// External Modules
import * as React from 'react';

// Types
import {IAssetItem} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {ButtonGroup, Label} from 'superdesk-ui-framework/react';
import {
    Modal,
    PanelContentBlock,
    PanelContentBlockInner,
} from '../../ui';
import {AssetImageRendition} from './AssetImageRendition';
import {getPreviewComponent} from './preview';
import {ToggleBoxNext} from 'superdesk-ui-framework';
import {VersionUserDateLines} from '../common/versionUserDateLines';

// Utils
import {
    showModalConnectedToStore,
    getHumanReadableFileSize,
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
        const mimetype = getMimetypeHumanReadable(this.props.asset?.mimetype);

        return (
            <Modal
                id="AssetImagePreviewFullscreenModal"
                size="fullscreen"
                closeModal={this.props.closeModal}
            >
                {/* Left section, containing image preview. */}

                <section
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '80%',
                        justifyContent: 'space-around',
                        display: 'flex',
                        backgroundColor: 'black',
                    }}
                >
                    {!ContentPreview ? null : (
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
                </section>

                {/* Right section, containing all the asset details. */}

                <section style={{position: 'absolute', right: 0, width: '20%', top: 0, bottom: 0, padding: '15px'}}>
                    <header>
                        <h4
                            style={{
                                fontSize: '18px',
                                fontWeight: 'normal',
                                paddingRight: '40px',
                                height: '24px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {gettext('Images')}
                        </h4>
                        <ButtonGroup align="right">
                            <i
                                className="icon-close-thick"
                                onClick={this.props.closeModal}
                                style={{
                                    background: 'none',
                                    padding: 0,
                                    border: 0,
                                    width: '16px',
                                    height: '16px',
                                    display: 'block',
                                    position: 'absolute',
                                    right: '12px',
                                    top: '14px',
                                    opacity: '0.7',
                                }}
                            />
                        </ButtonGroup>
                        <PanelContentBlock flex={true}>
                            <PanelContentBlockInner grow={true}>
                                <VersionUserDateLines item={this.props.asset!} />
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                        <span className="filetype-icon-picture" style={{color: '#a9a9a9'}} />
                    </header>
                    <div
                        style={{
                            position: 'absolute',
                            top: '130px',
                            left: '15px',
                            right: '5px',
                            bottom: '15px',
                            overflow: 'auto',
                            paddingRight: '10px',
                        }}
                    >
                        <ToggleBoxNext title="Details" isOpen={true}>
                            <div className="metadata-view">
                                <div className="metadata-view__content-block">
                                    <dl>
                                        <dt>{gettext('Name:')}</dt>
                                        <dd>{this.props.asset?.name}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Description:')}</dt>
                                        <dd>{this.props.asset?.description}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Filename:')}</dt>
                                        <dd>{this.props.asset?.filename}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Size:')}</dt>
                                        <dd>
                                            {this.props.asset?.length &&
                                            getHumanReadableFileSize(this.props.asset.length)}
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Type:')}</dt>
                                        <dd>{mimetype}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Dimensions:')}</dt>
                                        <dd>{this.props.asset?.name}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('State:')}</dt>
                                        <dd>
                                            <span className="state-label state-in_progress">
                                                {this.props.asset?.state}
                                            </span>
                                        </dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Set:')}</dt>
                                        <dd>{this.props.asset?.set_id}</dd>
                                    </dl>
                                    <dl>
                                        <dt>{gettext('Tags:')}</dt>
                                        <dd>
                                            {this.props.asset?.tags?.map((tag) => (
                                                <Label
                                                    key={this.props.asset?.tags.indexOf(tag)}
                                                    text={tag.name}
                                                    style="translucent"
                                                    size="large"
                                                />
                                            ))}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </ToggleBoxNext>
                    </div>
                </section>
            </Modal>
        );
    }
}
