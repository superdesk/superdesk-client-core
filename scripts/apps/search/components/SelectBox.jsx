import React from 'react';
import {isCheckAllowed} from '../helpers';

export class SelectBox extends React.Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
    }

    toggle(event) {
        event.stopPropagation();
        if (isCheckAllowed(this.props.item)) {
            var selected = !this.props.item.selected;

            this.props.onMultiSelect([this.props.item], selected);
        }
    }

    render() {
        if (this.props.item.selected) {
            this.props.item.selected = isCheckAllowed(this.props.item);
        }
        return React.createElement(
            'div',
            {
                className: 'selectbox',
                title: isCheckAllowed(this.props.item) ? null : 'selection not allowed',
                onClick: this.toggle
            },
            React.createElement(
                'span', {
                    className: 'sd-checkbox' + (this.props.item.selected ? ' checked' : '')
                }
            )
        );
    }
}

SelectBox.propTypes = {
    item: React.PropTypes.any,
    onMultiSelect: React.PropTypes.func,
};
