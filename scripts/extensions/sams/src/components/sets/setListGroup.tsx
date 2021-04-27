// External Modules
import * as React from 'react';

// Types
import {ISetItem, IStorageDestinationItem} from '../../interfaces';

// UI
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
    counts: Dictionary<string, number>;
    storageDestinations: Dictionary<string, IStorageDestinationItem>;
    previewSet(set: ISetItem): void;
    editSet(set: ISetItem): void;
    deleteSet?(set: ISetItem): void;
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
                                count={this.props.counts[set._id] === undefined ?
                                    0 :
                                    this.props.counts[set._id]
                                }
                                storageDestination={set?.destination_name == null ?
                                    undefined :
                                    this.props.storageDestinations[set.destination_name]
                                }
                                onClick={this.props.previewSet}
                                deleteSet={this.props.deleteSet}
                                editSet={this.props.editSet}
                                selected={this.props.currentSetId === set._id}
                            />
                        ))
                    )}
                </ListItemGroup>
            </React.Fragment>
        );
    }
}
