// External Modules
import * as React from 'react';

// Types
import {ISetItem, IStorageDestinationItem, SET_STATE} from '../../interfaces';

// UI
import {Badge, IconButton} from 'superdesk-ui-framework/react';
import {ListItem, ListItemActionMenu, ListItemBorder, ListItemColumn, ListItemRow} from '../../ui/list';

interface IProps {
    set: ISetItem;
    storageDestination?: IStorageDestinationItem;
    selected?: boolean;
    onClick(set: ISetItem): void;
    deleteSet?(set: ISetItem): void;
    editSet?(set: ISetItem): void;
}

export class SetListItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onItemClick = this.onItemClick.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onItemClick(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onClick) {
            event.stopPropagation();
            this.props.onClick(this.props.set);
        }
    }

    onEdit(event: any) {
        if (this.props.editSet) {
            event.stopPropagation();
            this.props.editSet(this.props.set);
        }
    }

    onDelete(event: any) {
        if (this.props.deleteSet) {
            event.stopPropagation();
            this.props.deleteSet(this.props.set);
        }
    }

    render() {
        const {set, storageDestination} = this.props;
        const storageDestinationText = storageDestination == null ?
            '' :
            `${storageDestination._id} / ${storageDestination.provider}`;

        return (
            <ListItem shadow={1} onClick={this.onItemClick} selected={this.props.selected}>
                <ListItemBorder />
                {set.state === SET_STATE.DRAFT ? null : (
                    <ListItemColumn>
                        <Badge text="0" type="success" />
                    </ListItemColumn>
                )}
                <ListItemColumn grow={true} noBorder={true}>
                    <ListItemRow>
                        <span className="sd-overflow-ellipsis">
                            <span className="sd-list-item__slugline">
                                {set.name}
                            </span>
                            {set.description}
                        </span>
                    </ListItemRow>
                </ListItemColumn>
                <ListItemColumn>
                    <ListItemRow>
                        {storageDestinationText}
                    </ListItemRow>
                </ListItemColumn>
                <ListItemActionMenu row={true}>
                    {this.props.deleteSet == null ? null : (
                        <IconButton icon="trash" ariaValue="delete" onClick={this.onDelete} />
                    )}
                    <IconButton icon="pencil" ariaValue="edit" onClick={this.onEdit} />
                </ListItemActionMenu>
            </ListItem>
        );
    }
}
