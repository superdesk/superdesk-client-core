import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {ListTypeIcon} from './ListTypeIcon';
import {ListPriority} from './ListPriority';
import {ListItemInfo} from './ListItemInfo';

interface IProps {
    item: IArticle;
    desk: IDesk;
    svc: any;
    openAuthoringView: any;
    ingestProvider: any;
    highlightsById: any;
    markedDesksById: any;
    profilesById: any;
    swimlane: any;
    versioncreator: any;
    narrow: any;
    onMultiSelect: () => any;
    getActionsMenu: () => any;
    scope: any;
    selectingDisabled: boolean;
    showNested: boolean;
    nestedCount: number;
    toggleNested: (event) => void;
}

export class ListItemTemplate extends React.Component<IProps, never> {
    render() {
        const {item} = this.props;

        return (
            <div>
                <span className="state-border" />
                <ListTypeIcon
                    item={item}
                    onMultiSelect={this.props.onMultiSelect}
                    svc={this.props.svc}
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
