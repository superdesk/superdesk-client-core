import * as React from 'react';
import {IDropdownLabel} from '../interfaces';

export class CropLabel extends React.PureComponent<IDropdownLabel> {
    render() {
        return (
            <button
                className={`
                    dropdown__toggle btn btn--ui-dark btn--hollow btn--icon-only btn--large
                    ${this.props.selectedItem ? 'btn--sd-green' : ''}
                `}
                onClick={this.props.onClick}
                disabled={this.props.disabled}
            >
                <i className="icon-crop" />
            </button>
        );
    }
}
