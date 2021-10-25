import React from 'react';
import {MediaPreview} from './MediaPreview';
import {MediaInfo} from './MediaInfo';
import {GridTypeIcon} from './GridTypeIcon';
import {IArticle, IDesk} from 'superdesk-api';
import {ItemPriority} from './ItemPriority';
import {ItemUrgency} from './ItemUrgency';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {BroadcastFieldComponent} from './fields/broadcast';

interface IProps {
    item: IArticle;
    itemSelected: boolean;
    desk: IDesk;
    swimlane: any;
    ingestProvider: any;
    getActionsMenu(): any;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

export class ItemMgridTemplate extends React.Component<IProps> {
    render() {
        const {item, itemSelected} = this.props;

        return (
            <div>
                <MediaPreview
                    item={item}
                    itemSelected={itemSelected}
                    desk={this.props.desk}
                    multiSelect={this.props.multiSelect}
                />
                <MediaInfo
                    item={item}
                    ingestProvider={this.props.ingestProvider}
                />
                <div className="media-box__footer">
                    <GridTypeIcon item={item} />
                    {item.priority ? <ItemPriority priority={item.priority} language={item.language} /> : null}
                    {item.urgency ? <ItemUrgency urgency={item.urgency} language={item.language} /> : null}
                    <BroadcastFieldComponent item={item} />
                    {this.props.getActionsMenu()}
                </div>
            </div>
        );
    }
}
