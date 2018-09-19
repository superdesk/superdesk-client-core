import React from 'react';
import PropTypes from 'prop-types';
import {isCheckAllowed} from '../helpers';

export class SelectBox extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
    }

    toggle(event) {
        if (event && (event.ctrlKey || event.shiftKey)) {
            return false;
        }

        event.stopPropagation();
        if (isCheckAllowed(this.props.item)) {
            const selected = !this.props.item.selected;

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
                className: this.props.classes ? this.props.classes : 'selectbox',
                title: isCheckAllowed(this.props.item) ? null : 'selection not allowed',
                onClick: this.toggle,
            },
            React.createElement(
                'span', {
                    className: 'sd-checkbox' + (this.props.item.selected ? ' checked' : ''),
                },
            ),
        );
    }
}

SelectBox.propTypes = {
    item: PropTypes.any,
    classes: PropTypes.string,
    onMultiSelect: PropTypes.func,
};
