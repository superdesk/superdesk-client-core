import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerError
 * @param {Array} children the children prop of the component
 * @param {Function} getSuggestions callback to get the list of suggestons for curent word
 * @param {Function} showContextMenu callback to show the spellchecker context menu for current word
 * @description The words with spellcheck errors are enclosed in this component in order to highlight
 * the error and allow the opening of the contextual spellchecker menu.
 */

export const SpellcheckerErrorComponent = ({children, getSuggestions, showContextMenu}) => {
    const style = styleMap.ERROR;
    const onContextMenu = (e) => {
        const left = e.clientX + 20;
        const top = e.clientY;
        const text = children[0].props.text;
        const offset = children[0].props.start;

        e.preventDefault();
        getSuggestions(text)
        .then((suggestions) => {
            showContextMenu({
                suggestions: suggestions,
                position: {
                    top: top + 10,
                    left: left - 40
                },
                word: {
                    text: text,
                    offset: offset
                }
            });
        });
    };

    return <span style={style} onContextMenu={onContextMenu}>{children}</span>;
};


/** Set the types of props for the spellchecker error component*/
SpellcheckerErrorComponent.propTypes = {
    children: React.PropTypes.array,
    getSuggestions: React.PropTypes.func,
    showContextMenu: React.PropTypes.func
};

/** Custom overrides for "error" style. */
const styleMap = {
    ERROR: {
        borderBottomWidth: '1px',
        borderBottomStyle: 'dotted',
        borderBottomColor: 'red'
    }
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
    getSuggestions: ownProps.getSuggestions
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