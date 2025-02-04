import React from 'react';
import {ListPriority} from './ListPriority';
import {ListItemInfo, IPropsItemListInfo} from './ListItemInfo';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';
import {MultiSelectCheckbox} from './MultiSelectCheckbox';

interface IPropsItemsListTemplate extends IPropsItemListInfo {
    itemSelected: boolean;
    selectingDisabled: boolean;
    getActionsMenu: () => any;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
    loading?: boolean;
}

export class ListItemTemplate extends React.Component<IPropsItemsListTemplate> {
    render() {
        const {item, itemSelected, multiSelect} = this.props;

        return (
            <div>
                <span className="state-border" />
                <MultiSelectCheckbox
                    item={item}
                    itemSelected={itemSelected}
                    multiSelect={multiSelect}
                />
                {
                    item.priority || item.urgency
                        ? <ListPriority item={item} singleLine={this.props.singleLine} />
                        : null
                }
                <ListItemInfo
                    loading={this.props.loading}
                    item={item}
                    relatedEntities={this.props.relatedEntities}
                    openAuthoringView={this.props.openAuthoringView}
                    desk={this.props.desk}
                    ingestProvider={this.props.ingestProvider}
                    highlightsById={this.props.highlightsById}
                    markedDesksById={this.props.markedDesksById}
                    profilesById={this.props.profilesById}
                    swimlane={this.props.swimlane}
                    versioncreator={this.props.versioncreator}
                    narrow={this.props.narrow}
                    isNested={this.props.isNested}
                    showNested={this.props.showNested}
                    toggleNested={this.props.toggleNested}
                    singleLine={this.props.singleLine}
                    customRender={this.props.customRender}
                />
                {this.props.getActionsMenu()}
            </div>
        );
    }
}
