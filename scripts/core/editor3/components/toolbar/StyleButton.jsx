import React from 'react';
import classNames from 'classnames';

const StyleIcons = {
    bold: 'icon-bold',
    italic: 'icon-italic',
    underline: 'icon-underline',
    strikethrough: 'icon-strikethrough',
    h1: 'icon-heading-1',
    h2: 'icon-heading-2',
    h3: 'icon-heading-3',
    h4: 'icon-heading-4',
    h5: 'icon-heading-5',
    h6: 'icon-heading-6',
    quote: 'icon-quote',
    unorderedlist: 'icon-unordered-list',
    orderedlist: 'icon-ordered-list'
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name StyleButton
 * @description Toolbar button that can be toggled.
 */
export default class StyleButton extends React.Component {
    constructor(props) {
        super(props);
        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.style);
    }

    render() {
        const {active, label} = this.props;
        const iconClass = StyleIcons[label];

        const cx = classNames({
            'Editor3-styleButton': true,
            'Editor3-activeButton': active
        });

        return (
            <span className={cx} onMouseDown={this.onToggle}>
                {iconClass ? <i className={iconClass} /> : <b>{label}</b>}
            </span>
        );
    }
}

StyleButton.propTypes = {
    onToggle: React.PropTypes.func,
    style: React.PropTypes.string,
    active: React.PropTypes.bool,
    label: React.PropTypes.string
};
