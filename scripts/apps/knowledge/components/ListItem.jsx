import React from 'react';
import {SelectBox} from 'apps/knowledge/components';
import classNames from 'classnames';

export class ListItem extends React.Component {
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
                className: classNames('list-field'),
                onMouseEnter: this.setHover,
                onMouseLeave: this.unsetHover
            },
            showSelect ?
                React.createElement(SelectBox, {
                    item: this.props.item
                }) : null
        );
    }
}

ListItem.propTypes = {
    item: React.PropTypes.any
};
