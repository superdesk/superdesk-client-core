import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {MarkForDeskButton} from './MarkBtn';

interface IProps {
    item: IArticle;
    className: string;
    desks: Array<IDesk>;
    noDesksLabel: string; // the label to be visible when there's no desk
}

/** Creates a list of desks that is used for marking a story for a desk */
export class MarkDesksDropdown extends React.Component<IProps> {
    render() {
        const {desks, item, className, noDesksLabel} = this.props;

        return (
            <ul className={className}>
                {
                    desks.length > 0
                        ? desks.map((desk) => (
                            <li key={desk._id}>
                                <MarkForDeskButton item={item} desk={desk} />
                            </li>
                        ))
                        : <li><button disabled>{noDesksLabel}</button></li>
                }
            </ul>
        );
    }
}
