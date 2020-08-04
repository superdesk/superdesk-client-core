import * as React from 'react';
import {ISetItem, IStorageDestinationItem} from '../../interfaces';

import {
    ListHeader,
    ListItemGroup,
    ListItem,
    ListItemColumn,
    ListItemRow,
} from '../../ui/';

import {SetListItem} from './setListItem';

interface IProps {
    title: string;
    noItemTitle: string;
    marginTop?: boolean;
    sets: Array<ISetItem>;
    storageDestinations: {[key: string]: IStorageDestinationItem};
    onItemClicked(set: ISetItem): void;
    onDelete?(set: ISetItem): void;
    onEdit(set: ISetItem): void;
    currentSetId?: string;
}

export class SetListGroup extends React.PureComponent<IProps> {
    render() {
        return (
            <React.Fragment>
                <ListHeader title={this.props.title} marginTop={this.props.marginTop} />
                <ListItemGroup spaceBetweenItems={true}>
                    {this.props.sets?.length === 0 ? (
                        <ListItem inactive={true} shadow={2} noHover={true}>
                            <ListItemColumn>
                                <ListItemRow>
                                    <span>
                                        {this.props.noItemTitle}
                                    </span>
                                </ListItemRow>
                            </ListItemColumn>
                        </ListItem>
                    ) : (
                        this.props.sets.map((set) => (
                            <SetListItem
                                key={set._id}
                                set={set}
                                onClick={this.props.onItemClicked}
                                onDelete={this.props.onDelete}
                                onEdit={this.props.onEdit}
                                selected={this.props.currentSetId === set._id}
                            />
                        ))
                    )}
                </ListItemGroup>
            </React.Fragment>
        );
    }
}
