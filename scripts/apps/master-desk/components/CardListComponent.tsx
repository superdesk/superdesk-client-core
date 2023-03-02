import React from 'react';

interface IProps {
    name: string;
    total: number;
    color: string;
}

export class CardListComponent extends React.Component<IProps> {
    render() {
        return (
            <li className="sd-board__list-item">
                <h6 className="sd-board__list-item-title">{this.props.name}</h6>
                <span className="badge sd-margin-end--0-5" style={{'background': this.props.color}}>
                    {this.props.total || 0}
                </span>
            </li>
        );
    }
}
