import React from 'react';
import {TypeIcon, SelectBox} from 'apps/search/components';
import classNames from 'classnames';

export class ListTypeIcon extends React.Component {
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
        var showSelect = this.state.hover || this.props.item.selected;

        return React.createElement(
            'div',
            {
                className: classNames('list-field type-icon'),
                onMouseEnter: this.setHover,
                onMouseLeave: this.unsetHover
            },
            showSelect ?
                React.createElement(SelectBox, {
                    item: this.props.item,
                    onMultiSelect: this.props.onMultiSelect
                }) :
                React.createElement(
                    TypeIcon,
                    {
                        type: this.props.item.type,
                        package_type: this.props.item.package_type,
                        highlight: this.props.item.highlight
                    }
                )
        );
    }
}

ListTypeIcon.propTypes = {
    onMultiSelect: React.PropTypes.func,
    item: React.PropTypes.any
};
