import * as React from 'react';
import {IDropdownLabel} from '../interfaces';

export class QualityLabel extends React.PureComponent<IDropdownLabel> {
    render() {
        const value = this.props.selectedItem?.value ? this.props.selectedItem?.label : 'Same';

        return (
            <button
                className="dropdown__toggle dark-ui dropdown-toggle"
                aria-haspopup="true"
                aria-expanded="false"
                onClick={this.props.onClick}
                sd-tooltip={this.props.title}
            >
                {this.props.gettext?.(value)}
                <span className="dropdown__caret dropdown__caret--white" />
            </button>
        );
    }
}
