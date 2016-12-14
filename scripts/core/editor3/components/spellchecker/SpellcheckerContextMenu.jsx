import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerContextMenu
 * @param {Boolean} isVisible if false the component will not show
 * @param {String} word the text the menu is opened for
 * @param {Array} suggestions the list of suggestions for the target word
 * @param {Object} position the editor relative position where the context menu will be showed
 * @param {addWord} addWord callback
 * @param {replaceWord} replaceWord callback
 * @description The context menu for correction spellcheck errors. Contains a list of suggestions
 * and 'Add to dictionary' and 'Ignore word' actions.
 */

export const SpellcheckerContextMenuComponent = ({
        isVisible, word, suggestions, position, addWord, replaceWord}) => {
    if (!isVisible) {
        return null;
    }
    return (
        <div className={'dropdown open'} style={position}>
            <ul className={'dropdown__menu'}>
                {suggestions.length === 0 ?
                    <li><button>SORRY, NO SUGGESTIONS.</button></li>
                    :
                    suggestions.map((suggestion, index) =>
                        <li key={index}>
                            <button onClick={() => replaceWord(suggestion.key)}>
                                {suggestion.value}
                            </button>
                        </li>
                    )
                }
                <li className="divider"/>
                <li>
                    <button onClick={
                        () => {
                            addWord(word, false);
                            replaceWord(word);
                        }
                    }>Add to dictionary</button>
                </li>
                <li>
                    <button onClick={
                        () => {
                            addWord(word, true);
                            replaceWord(word);
                        }
                    }>Ignore word</button>
                </li>
            </ul>
        </div>
    );
};


/** Set the types of props for the spellchecker context menu component*/
SpellcheckerContextMenuComponent.propTypes = {
    isVisible: React.PropTypes.bool,
    word: React.PropTypes.string,
    suggestions: React.PropTypes.array,
    position: React.PropTypes.object,
    addWord: React.PropTypes.func,
    replaceWord: React.PropTypes.func
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#isVisibleContextMenu
 * @param {Object} state the store state
 * @returns {Boolean}
 * @description Return true if the context menu is visible.
 */
const isVisibleContextMenu = (state) => {
    const {editorState, spellcheckerState} = state;

    if (!editorState || !spellcheckerState || !spellcheckerState.contextMenuData) {
        return false;
    }

    const newSelection = editorState.getSelection();
    const oldSelection = spellcheckerState.contextMenuData.editorSelection;

    return oldSelection && newSelection
        && oldSelection.anchorOffset === newSelection.anchorOffset
        && oldSelection.focusOffset === newSelection.focusOffset;
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#initPosition
 * @param {Object} state the store state
 * @param {Object} ownProps the component props
 * @returns {Object} Returns the context menu position
 * @description If the context menu is visible initialize the
 * position of the context menu.
 */
const initPosition = (state, ownProps) => {
    const {spellcheckerState} = state;
    const rect = ownProps.editorRect;

    if (!spellcheckerState || !spellcheckerState.contextMenuData || !rect) {
        return null;
    }

    const position = spellcheckerState.contextMenuData.position;

    return Object.assign({}, position, {
        display: 'block',
        left: position.left - rect.left,
        top: position.top - rect.top
    });
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#getWord
 * @param {Object} state the store state
 * @returns {Array} Returns the list of suggestioinf for the current word
 * @description If the context menu is visible extract from store the
 * list of suggestions for the current word.
 */
const getSuggestions = (state) => {
    if (!isVisibleContextMenu(state)) {
        return null;
    }

    return state.spellcheckerState.contextMenuData.suggestions;
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#getWord
 * @param {Object} state the store state
 * @returns {String} Returns the current word
 * @description If the context menu is visible extract current word from store.
 */
const getWord = (state) => {
    if (!isVisibleContextMenu(state)) {
        return null;
    }

    return state.spellcheckerState.contextMenuData.word.text;
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#getAddWord
 * @param {Object} state the store state
 * @returns {Function} Returns the addWord callback
 * @description If the context menu is visible extract addWord callback from store.
 */
const getAddWord = (state) => {
    if (!isVisibleContextMenu(state)) {
        return null;
    }

    return state.spellcheckerState.spellcheckerService.addWord;
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#mapStateToProps
 * @param {Object} state the store state
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component value type props.
 */
const mapStateToProps = (state, ownProps) => ({
    isVisible: isVisibleContextMenu(state),
    word: getWord(state),
    suggestions: getSuggestions(state),
    position: initPosition(state, ownProps),
    addWord: getAddWord(state)
});

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    replaceWord: (word) => setTimeout(() => dispatch(actions.replaceWord(word)), 0)
});

export const SpellcheckerContextMenu = connect(mapStateToProps, mapDispatchToProps)(SpellcheckerContextMenuComponent);
