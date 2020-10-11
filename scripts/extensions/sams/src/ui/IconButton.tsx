import * as React from 'react';
import {Icon} from './Icon';
interface IProps {
    id?: string; // used for tooltip
    icon?: string;
    ariaValue: string;
    onClick(event: React.MouseEvent<HTMLAnchorElement>): void;
}

export class IconButton extends React.PureComponent<IProps> {
    render() {
        return (
            <a
                id={this.props.id}
                onClick={this.props.onClick}
                className="icn-btn"
                aria-label={this.props.ariaValue}>
                <Icon name={this.props.icon} ariaHidden={true}/>
            </a>
        );
    }
}
