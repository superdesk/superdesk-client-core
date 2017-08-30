import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name LinkButtonComponent
 * @param {Object} editorState The editor state object.
 * @description This component holds the link button for the toolbar and the small
 * link editing popover that displays when clicking a link.
 */
export class LinkButtonComponent extends Component {
    render() {
        const {editorState, onClick} = this.props;
        const isCollapsed = editorState.getSelection().isCollapsed();

        const cx = classNames({
            'link-button': true,
            inactive: isCollapsed
        });

        return (
            <div data-flow={'down'} data-sd-tooltip={gettext('Link')} className="Editor3-styleButton">
                <span className={cx} onClick={(e) => onClick()}>
                    <i className="icon-link" />
                </span>
            </div>
        );
    }
}

LinkButtonComponent.propTypes = {
    editorState: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
    options: state.editorFormat
});

export const LinkButton = connect(mapStateToProps, null)(LinkButtonComponent);
