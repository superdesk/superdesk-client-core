import React from 'react';
import {MediaPreview} from './MediaPreview';
import {MediaInfo} from './MediaInfo';
import {GridTypeIcon} from './GridTypeIcon';
import {IArticle} from 'superdesk-interfaces/Article';
import {IDesk} from 'superdesk-interfaces/Desk';
import {ItemPriority} from './ItemPriority';
import {ItemUrgency} from './ItemUrgency';

interface IProps {
    item: IArticle;
    desk: IDesk;
    swimlane: any;
    svc: any;
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
                    swimlane={this.props.swimlane}
                    svc={this.props.svc}
                />
                <MediaInfo
                    item={item}
                    ingestProvider={this.props.ingestProvider}
                    svc={this.props.svc}
                />
                <div className="media-box__footer">
                    <GridTypeIcon item={item} svc={this.props.svc} />
                    {item.priority ? <ItemPriority {...angular.extend({svc: this.props.svc}, item)} /> : null}
                    {item.urgency ? <ItemUrgency {...angular.extend({svc: this.props.svc}, item)} /> : null}
                    {this.props.broadcast({item: item})}
                    {this.props.getActionsMenu()}
                </div>
            </div>
        );
    }
}
