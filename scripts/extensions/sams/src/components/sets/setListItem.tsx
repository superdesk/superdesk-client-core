import * as React from 'react';

import {ISetItem} from '../../interfaces';
import {SET_STATE} from '../../constants';

import {Badge, IconButton} from 'superdesk-ui-framework/react';

import {ListItem, ListItemActionMenu, ListItemBorder, ListItemColumn, ListItemRow} from '../../ui/list';

interface IProps {
    set: ISetItem;
    selected?: boolean;
    onClick(set: ISetItem): void;
    onDelete?(set: ISetItem): void;
    onEdit?(set: ISetItem): void;
}

export class SetListItem extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onItemClick = this.onItemClick.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onItemClick(e: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onClick) {
            e.preventDefault();
            e.stopPropagation();
            this.props.onClick(this.props.set);
        }
    }

    onEdit(e: React.MouseEvent<HTMLAnchorElement>) {
        if (this.props.onEdit) {
            e.preventDefault();
            e.stopPropagation();
            this.props.onEdit(this.props.set);
        }
    }

    onDelete(e: React.MouseEvent<HTMLDivElement>) {
        if (this.props.onDelete) {
            e.preventDefault();
            e.stopPropagation();
            this.props.onDelete(this.props.set);
        }
    }

    render() {
        const set = this.props.set;

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
                        {set.destination?._id} / {set.destination?.provider}
                    </ListItemRow>
                </ListItemColumn>
                <ListItemActionMenu row={true}>
                    {this.props.onDelete == null ? null : (
                        <IconButton icon="trash" ariaValue="delete" onClick={this.onDelete} />
                    )}
                    <IconButton icon="pencil" ariaValue="edit" onClick={this.onEdit} />
                </ListItemActionMenu>
            </ListItem>
        );
    }
}
