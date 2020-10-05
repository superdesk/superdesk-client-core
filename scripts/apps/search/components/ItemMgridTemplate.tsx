import React from 'react';
import {MediaPreview} from './MediaPreview';
import {MediaInfo} from './MediaInfo';
import {GridTypeIcon} from './GridTypeIcon';
import {IArticle, IDesk} from 'superdesk-api';
import {ItemPriority} from './ItemPriority';
import {ItemUrgency} from './ItemUrgency';

interface IProps {
    item: IArticle;
    desk: IDesk;
    swimlane: any;
    ingestProvider: any;
    onMultiSelect(): any;
    broadcast(obj: any): any;
    getActionsMenu(): any;
}

export class ItemMgridTemplate extends React.Component<IProps, never> {
    render() {
        const {item} = this.props;

        return (
            <div>
                <MediaPreview
                    item={item}
                    desk={this.props.desk}
                    onMultiSelect={this.props.onMultiSelect}
                />
                <MediaInfo
                    item={item}
                    ingestProvider={this.props.ingestProvider}
                />
                <div className="media-box__footer">
                    <GridTypeIcon item={item} />
                    {item.priority ? <ItemPriority priority={item.priority} /> : null}
                    {item.urgency ? <ItemUrgency urgency={item.urgency} /> : null}
                    {this.props.broadcast({item: item})}
                    {this.props.getActionsMenu()}
                </div>
            </div>
        );
    }
}
