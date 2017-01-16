import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerError
 * @param {Array} children the children prop of the component
 * @param {Function} showContextMenu callback to show the spellchecker context menu for current word
 * @description The words with spellcheck errors are enclosed in this component in order to highlight
 * the error and allow the opening of the contextual spellchecker menu.
 */

export const SpellcheckerErrorComponent = ({children, showContextMenu}) => {
    const word = {
        text: children[0].props.text,
        offset: children[0].props.start
    };

    const onContextMenu = (e) => {
        const position = {
            left: e.clientX - 20,
            top: e.clientY + 10
        };

        e.preventDefault();

        showContextMenu({word, position});
    };

    return <span className="word-typo" onContextMenu={onContextMenu}>{children}</span>;
};


/** Set the types of props for the spellchecker error component*/
SpellcheckerErrorComponent.propTypes = {
    children: React.PropTypes.array,
    showContextMenu: React.PropTypes.func
};

/**
 * @ngdoc method
 * @name SpellcheckerError#mapStateToProps
 * @param {Object} state the store state
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component value type props.
 */
const mapStateToProps = (state, ownProps) => ({
    children: ownProps.children,
});

/**
 * @ngdoc method
 * @name SpellcheckerError#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    showContextMenu: (contextMenuData) => dispatch(actions.showContextMenu(contextMenuData))
});

export const SpellcheckerError = connect(mapStateToProps, mapDispatchToProps)(SpellcheckerErrorComponent);
