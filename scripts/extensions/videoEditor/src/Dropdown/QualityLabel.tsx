import * as React from 'react';
import {IDropdownLabel} from '../interfaces';

export class QualityLabel extends React.PureComponent<IDropdownLabel> {
    render() {
        const value = String(this.props.selectedItem || 'Same');

        return (
            <button
                className="dropdown__toggle dark-ui dropdown-toggle"
                aria-haspopup="true"
                aria-expanded="false"
                onClick={this.props.onClick}
                sd-tooltip={this.props.title}
            >
                {this.props.getText!(value)}
                <span className="dropdown__caret dropdown__caret--white" />
            </button>
        );
    }
}
