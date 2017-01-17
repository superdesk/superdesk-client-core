import React, {Component} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import ng from 'core/services/ng';

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
class SpellcheckerContextMenuComponent extends Component {
    constructor(props) {
        super(props);

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
        const spellcheck = ng.get('spellcheck');
        const {word} = this.props;

        spellcheck.addWord(word.text, false);
        this.props.onIgnore();
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#replaceWord
     * @param {Event} e
     * @description Handles the replace word command.
     */
    replaceWord(newWord) {
        const {word} = this.props;

        return (e) => {
            this.props.replaceWord({word, newWord});
        };
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#ignoreWord
     * @param {Event} e
     * @description Handles the ignore word command.
     */
    ignoreWord(e) {
        const spellcheck = ng.get('spellcheck');
        const {word} = this.props;

        spellcheck.addWord(word.text, true);
        this.props.onIgnore();
    }

    render() {
        const {suggestions} = this.props;

        return (
            <div className={'dropdown open suggestions-dropdown'}>
                <ul className={'dropdown__menu'}>
                    {suggestions.length === 0 ? <li><button>SORRY, NO SUGGESTIONS.</button></li>
                        : suggestions.map((suggestion, index) =>
                            <li key={index}>
                                <button onMouseDown={this.replaceWord(suggestion.key)}>
                                    {suggestion.value}
                                </button>
                            </li>
                        )
                    }
                    <li className="divider"/>
                    <li><button onMouseDown={this.addWord}>Add to dictionary</button></li>
                    <li><button onMouseDown={this.ignoreWord}>Ignore word</button></li>
                </ul>
            </div>
        );
    }
}


/** Set the types of props for the spellchecker context menu component*/
SpellcheckerContextMenuComponent.propTypes = {
    word: React.PropTypes.object,
    suggestions: React.PropTypes.array,
    replaceWord: React.PropTypes.func,
    onIgnore: React.PropTypes.func
};

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
});

export const SpellcheckerContextMenu = connect(null, mapDispatchToProps)(SpellcheckerContextMenuComponent);
