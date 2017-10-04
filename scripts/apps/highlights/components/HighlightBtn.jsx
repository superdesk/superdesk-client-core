import React from 'react';
import PropTypes from 'prop-types';

/*
 * Creates specific highlight button in list
 * @return {React} Language button
 */
export default class HighlightBtn extends React.Component {
    constructor(props) {
        super(props);
        this.markHighlight = this.markHighlight.bind(this);
    }

    markHighlight(event) {
        event.stopPropagation();
        this.props.service.markItem(this.props.highlight._id, this.props.item);
    }

    render() {
        var item = this.props.item;
        var highlight = this.props.highlight;
        var isMarked = item.highlights && item.highlights.indexOf(highlight._id) >= 0;

        return React.createElement(
            'button',
            {disabled: isMarked, onClick: this.markHighlight},
            React.createElement('i', {className: 'icon-star'}),
            highlight.label
        );
    }
}

HighlightBtn.propTypes = {
    highlight: PropTypes.object,
    item: PropTypes.object,
    service: PropTypes.any
};
