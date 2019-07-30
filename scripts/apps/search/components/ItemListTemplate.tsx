import React from 'react';
import {ListTypeIcon} from './ListTypeIcon';
import {ListPriority} from './ListPriority';
import {ListItemInfo, IPropsItemListInfo} from './ListItemInfo';

interface IPropsItemsListTemplate extends IPropsItemListInfo {
    selectingDisabled: boolean;
    getActionsMenu: () => any;
    onMultiSelect: () => any;
}

export class ListItemTemplate extends React.Component<IPropsItemsListTemplate> {
    render() {
        const {item} = this.props;

        return (
            <div>
                <span className="state-border" />
                <ListTypeIcon
                    item={item}
                    onMultiSelect={this.props.onMultiSelect}
                    selectingDisabled={this.props.selectingDisabled}
                />
                {
                    item.priority || item.urgency
                        ? <ListPriority
                            item={item}
                            svc={this.props.svc}
                            scope={this.props.scope}
                        />
                        : null
                }
                <ListItemInfo
                    item={item}
                    openAuthoringView={this.props.openAuthoringView}
                    desk={this.props.desk}
                    ingestProvider={this.props.ingestProvider}
                    highlightsById={this.props.highlightsById}
                    markedDesksById={this.props.markedDesksById}
                    profilesById={this.props.profilesById}
                    swimlane={this.props.swimlane}
                    versioncreator={this.props.versioncreator}
                    narrow={this.props.narrow}
                    svc={this.props.svc}
                    scope={this.props.scope}
                    showNested={this.props.showNested}
                    nestedCount={this.props.nestedCount}
                    toggleNested={this.props.toggleNested}
                />
                {this.props.getActionsMenu()}
            </div>
        );
    }
}
