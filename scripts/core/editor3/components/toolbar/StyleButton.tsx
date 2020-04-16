import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {gettext} from 'core/utils';

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
    'unordered list': 'icon-unordered-list',
    'ordered list': 'icon-ordered-list',
    suggestions: 'icon-suggestion',
    invisibles: 'icon-paragraph',
    pre: 'icon-preformatted',
    subscript: 'icon-subscript',
    superscript: 'icon-superscript',
};

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name StyleButton
 * @description Toolbar button that can be toggled.
 */
export default class StyleButton extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.onToggle = this.onToggle.bind(this);
    }

    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.style, this.props.active);
    }

    render() {
        const {active, label} = this.props;
        const iconClass = StyleIcons[label];

        const cx = classNames({
            'Editor3-styleButton': true,
            'Editor3-activeButton': active,
        });

        const styleTooltips = {
            bold: gettext('Bold (Ctrl+B)'),
            italic: gettext('Italic (Ctrl+I)'),
            underline: gettext('Underline (Ctrl+U)'),
            strikethrough: gettext('Strikethrough'),
            h1: gettext('H1'),
            h2: gettext('H2'),
            h3: gettext('H3'),
            h4: gettext('H4'),
            h5: gettext('H5'),
            h6: gettext('H6'),
            quote: gettext('Quote'),
            'unordered list': gettext('Unordered list'),
            'ordered list': gettext('Ordered list'),
            TH: gettext('Toggle Header'),
            suggestions: gettext('Toggle Suggestions Mode'),
            invisibles: gettext('Toggle formatting marks'),
            pre: gettext('Preformatted text'),
            subscript: gettext('Subscript'),
            superscript: gettext('Superscript'),
        };

        return (
            <span className={cx} data-sd-tooltip={styleTooltips[label]} data-flow={'down'} onMouseDown={this.onToggle}>
                {iconClass ? <i className={iconClass} /> : <b>{label}</b>}
            </span>
        );
    }
}

StyleButton.propTypes = {
    onToggle: PropTypes.func,
    style: PropTypes.string,
    active: PropTypes.bool,
    label: PropTypes.string,
};
