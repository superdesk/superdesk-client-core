// External Modules
import * as React from 'react';

// Types
import {IAssetItem} from '../../interfaces';
import {superdeskApi} from '../../apis';

// UI
import {Icon} from 'superdesk-ui-framework/react';
import {
    ListItem,
    ListItemBorder,
    ListItemColumn,
    ListItemRow,
} from '../../ui/list';

// Utils
import {getIconTypeFromMimetype, getAssetStateLabel, getHumanReadableFileSize} from '../../utils/ui';

interface IProps {
    asset: IAssetItem;
    selected: boolean;
    onClick?(): void;
}

export class AssetListItem extends React.PureComponent<IProps> {
    render() {
        const {gettext, longFormatDateTime} = superdeskApi.localization;

        return (
            <ListItem shadow={1} selected={this.props.selected} onClick={this.props.onClick}>
                <ListItemBorder />
                <ListItemColumn>
                    <Icon name={getIconTypeFromMimetype(this.props.asset.mimetype)} />
                </ListItemColumn>
                <ListItemColumn grow={true}>
                    <ListItemRow>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__slugline">
                                {this.props.asset.name}
                            </span>
                            {this.props.asset.description}
                        </span>
                        <time>{longFormatDateTime(this.props.asset._updated)}</time>
                    </ListItemRow>
                    <ListItemRow>
                        {getAssetStateLabel(this.props.asset.state)}
                        <span className="sd-overflow-ellipsis">
                            <span className="sd-list-item__text-label">
                                {gettext('Type:')}
                            </span>
                            <span className="sd-list-item__inline-text">
                                {this.props.asset.mimetype}
                            </span>
                            <span className="sd-list-item__text-label">
                                {gettext('Size:')}
                            </span>
                            <span className="sd-list-item__inline-text">
                                {getHumanReadableFileSize(this.props.asset.length)}
                            </span>
                        </span>
                    </ListItemRow>
                </ListItemColumn>
            </ListItem>
        );
    }
}
