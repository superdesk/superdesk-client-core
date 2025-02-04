import React from 'react';
import ng from 'core/services/ng';
import {IArticle, IDesk} from 'superdesk-api';

interface IProps {
    item: IArticle; // the story to be marked
    desk: IDesk; // desk for the item to be marked
}

export class MarkForDeskButton extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this.markForDesk = this.markForDesk.bind(this);
    }

    markForDesk(event) {
        event.stopPropagation();

        const {desk, item} = this.props;

        ng.get('desks').markItem(desk._id, item);
    }

    render() {
        const {desk, item} = this.props;
        const isMarked = item.marked_desks?.find((_desk) => _desk?.desk_id === desk._id) != null;

        return (
            <button disabled={isMarked} onClick={this.markForDesk} data-test-id="mark-for-desk--desk">
                <i className="icon-bell" />{desk.name}
            </button>
        );
    }
}
