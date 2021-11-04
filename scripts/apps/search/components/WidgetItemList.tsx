import React from 'react';
import {WidgetItem} from './index';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {generateTrackByIdentifier} from '../services/SearchService';

interface IProps {
    canEdit?: boolean;
    customMonitoringWidget?: boolean;
    select: (item: IArticle) => void;
    edit: (item: IArticle) => void;
    customUIMessages?: {
        empty?: string;
    };
    itemIds: Array<string> | null;
    itemsById: any | null;
    loading: boolean;
    selected?: { _id: string };
}

/**
 * @ngdoc React
 * @module superdesk.search
 * @name WidgetItemComponent
 * @description This component is the list of items from a monitoring widget group.
 */
export class WidgetItemList extends React.Component<IProps> {
    render() {
        if (this.props.loading || this.props.itemIds == null) {
            return <div className="item-group__loading" />;
        }

        if (!this.props.itemIds?.length) {
            return (
                <div className="item-group__no-items">
                    {this.props.customUIMessages?.empty
                        ? this.props.customUIMessages.empty
                        : gettext('No items in this stage')}
                </div>
            );
        }

        return (
            <div tabIndex={0}>
                <ul className="inline-content-items">
                    {this.props.itemIds.map((itemId) => {
                        const item = this.props.itemsById[itemId];

                        return (
                            <WidgetItem
                                key={generateTrackByIdentifier(item)}
                                item={item}
                                selected={
                                    this.props.selected &&
                                    this.props.selected._id === item._id
                                }
                                canEdit={this.props.canEdit}
                                customMonitoringWidget={
                                    this.props.customMonitoringWidget
                                }
                                select={this.props.select}
                                edit={this.props.edit}
                            />
                        );
                    })}
                </ul>
            </div>
        );
    }
}
