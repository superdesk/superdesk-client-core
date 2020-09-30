// External modules
import * as React from 'react';

// Types
import {ISuperdesk} from 'superdesk-api';
import {IAssetItem} from '../../interfaces';

// UI
import {PanelContent, PanelContentBlock, PanelContentBlockInner, PanelHeader, Text} from '../../ui';
import {FormLabel} from 'superdesk-ui-framework/react';

// Utils
import {
    getHumanReadableFileSize,
} from '../../utils/ui';

interface IProps {
    asset?: IAssetItem;
    setName?: string;
    onPanelClosed(): void;
}

export function getShowAssetPreviewPanelComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;

    return class AssetPreviewPanel extends React.Component<IProps> {
        render() {
            const {asset, setName} = this.props;

            if (asset?._id == null) {
                return null;
            }

            return (
                <React.Fragment>
                    <PanelHeader onClose={this.props.onPanelClosed} borderB={true} title={gettext('Asset Preview')} />
                    <PanelContent>
                        <PanelContentBlock flex={true}>
                            <PanelContentBlockInner grow={true}>
                                <FormLabel text={gettext('Name')} style="light" />
                                <Text>{asset.name}</Text>

                                <FormLabel text={gettext('Description')} style="light" />
                                <Text>{asset.description}</Text>

                                <FormLabel text={gettext('Filename')} style="light" />
                                <Text>{asset.filename}</Text>

                                <FormLabel text={gettext('FileLength')} style="light" />
                                <Text>{getHumanReadableFileSize(asset.length)}</Text>

                                <FormLabel text={gettext('Mimetype')} style="light" />
                                <Text>{asset.mimetype}</Text>

                                <FormLabel text={gettext('Usage')} style="light" />
                                <Text>{asset.state}</Text>

                                <FormLabel text={gettext('SetName')} style="light" />
                                <Text>{setName}</Text>
                            </PanelContentBlockInner>
                        </PanelContentBlock>
                    </PanelContent>
                </React.Fragment>
            );
        }
    };
}
