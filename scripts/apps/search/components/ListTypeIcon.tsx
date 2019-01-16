import React from 'react';
import PropTypes from 'prop-types';
import {TypeIcon, SelectBox} from './index';
import classNames from 'classnames';

export class ListTypeIcon extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {hover: false};

        this.setHover = this.setHover.bind(this);
        this.unsetHover = this.unsetHover.bind(this);
    }

    setHover() {
        this.setState({hover: true});
    }

    unsetHover() {
        if (this.state.hover) {
            this.setState({hover: false});
        }
    }

    render() {
        const showSelect = this.state.hover || this.props.item.selected;

        return React.createElement(
            'div',
            {
                className: classNames('list-field type-icon sd-monitoring-item-multi-select-checkbox'),
                onMouseEnter: this.setHover,
                onMouseLeave: this.unsetHover,
                style: {lineHeight: 0},
            },
            showSelect ?
                React.createElement(SelectBox, {
                    item: this.props.item,
                    onMultiSelect: this.props.onMultiSelect,
                }) :
                React.createElement(
                    TypeIcon,
                    {
                        type: this.props.item.type,
                        highlight: this.props.item.highlight,
                        svc: this.props.svc,
                    },
                ),
        );
    }
}

ListTypeIcon.propTypes = {
    svc: PropTypes.object.isRequired,
    onMultiSelect: PropTypes.func,
    item: PropTypes.any,
};
