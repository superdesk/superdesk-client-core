import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import $ from 'jquery';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerContextMenu
 * @param {String} word the text the menu is opened for
 * @param {Array} suggestions the list of suggestions for the target word
 * @param {Object} position the editor relative position where the context menu will be showed
 * @param {replaceWord} replaceWord callback
 * @description The context menu for correction spellcheck errors. Contains a list of suggestions
 * and 'Add to dictionary' and 'Ignore word' actions.
 */
export default class SpellcheckerContextMenuComponent extends Component {
    constructor(props) {
        super(props);

        // scrolling might change the editorRect prop, which could cause
        // the context menu to bounce to a new location, so we persist the
        // original position when the menu is already open.
        this.editorRect = props.editorRect;

        this.addWord = this.addWord.bind(this);
        this.replaceWord = this.replaceWord.bind(this);
        this.ignoreWord = this.ignoreWord.bind(this);
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#addWord
     * @param {Event} e
     * @description Handles the add word command.
     */
    addWord(e) {
        const {addWord, word} = this.props;

        addWord(word);
        e.stopPropagation();
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#replaceWord
     * @param {Event} e
     * @description Handles the replace word command.
     */
    replaceWord(key) {
        return (e) => {
            this.props.replaceWord(key);
            e.stopPropagation();
        };
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#ignoreWord
     * @param {Event} e
     * @description Handles the ignore word command.
     */
    ignoreWord(e) {
        const {ignoreWord, word} = this.props;

        ignoreWord(word);
        e.stopPropagation();
    }

    componentWillMount() {
        this.editorRect = this.props.editorRect;
    }

    componentWillUpdate(nextProps) {
        const {visible, editorRect} = this.props;

        // about to show?
        if (!visible && nextProps.visible) {
            this.editorRect = editorRect;
        }
    }

    componentDidUpdate(prevProps) {
        const {visible, closeContextMenu} = this.props;

        if (prevProps.visible === visible) {
            return;
        }

        const fn = visible ? 'on' : 'off';

        $(window)[fn]('click', closeContextMenu);
    }

    render() {
        const {visible, suggestions, position} = this.props;

        if (!visible) {
            return null;
        }

        const style = {
            display: 'block',
            left: position.left - this.editorRect.left,
            top: position.top - this.editorRect.top
        };

        return (
            <div className={'dropdown open'} style={style}>
                <ul className={'dropdown__menu'}>
                    {suggestions.length === 0 ? <li><button>SORRY, NO SUGGESTIONS.</button></li>
                        : suggestions.map((suggestion, index) =>
                            <li key={index}>
                                <button onClick={this.replaceWord(suggestion.key)}>
                                    {suggestion.value}
                                </button>
                            </li>
                        )
                    }
                    <li className="divider"/>
                    <li><button onClick={this.addWord}>Add to dictionary</button></li>
                    <li><button onClick={this.ignoreWord}>Ignore word</button></li>
                </ul>
            </div>
        );
    }
}


/** Set the types of props for the spellchecker context menu component*/
SpellcheckerContextMenuComponent.propTypes = {
    visible: React.PropTypes.bool,
    word: React.PropTypes.string,
    suggestions: React.PropTypes.array,
    position: React.PropTypes.object,
    editorRect: React.PropTypes.object,
    replaceWord: React.PropTypes.func,
    addWord: React.PropTypes.func,
    ignoreWord: React.PropTypes.func,
    closeContextMenu: React.PropTypes.func
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#mapStateToProps
 * @param {Object} state the store state
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component value type props.
 */
const mapStateToProps = (state, ownProps) => ({
    visible: state.spellcheckerMenu.visible,
    word: state.spellcheckerMenu.word.text,
    suggestions: state.spellcheckerMenu.suggestions,
    position: state.spellcheckerMenu.position
});

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    addWord: (word) => dispatch(actions.ignoreWord(word)),
    ignoreWord: (word) => dispatch(actions.addWord(word)),
    replaceWord: (word) => setTimeout(() => dispatch(actions.replaceWord(word)), 0),
    closeContextMenu: () => dispatch(actions.closeContextMenu())
});

export const SpellcheckerContextMenu = connect(mapStateToProps, mapDispatchToProps)(SpellcheckerContextMenuComponent);
