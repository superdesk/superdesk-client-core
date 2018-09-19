import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import ng from 'core/services/ng';
import {StickElementsWithTracking} from 'core/helpers/dom/stickElementsWithTracking';

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
export class SpellcheckerContextMenuComponent extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    stickyElementTracker: any;
    dropdownElement: any;

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
        const {word, refreshWord} = this.props;

        spellcheck.addWord(word.text, false);
        refreshWord(word);
    }

    /**
     * @ngdoc method
     * @name SpellcheckerContextMenu#replaceWord
     * @param {Event} e
     * @description Handles the replace word command.
     */
    replaceWord(newWord) {
        const {word, replaceWord} = this.props;

        return (e) => {
            replaceWord({word, newWord});
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
        const {word, refreshWord} = this.props;

        spellcheck.addWord(word.text, true);
        refreshWord(word);
    }

    componentDidMount() {
        this.stickyElementTracker = new StickElementsWithTracking(this.props.targetElement, this.dropdownElement);
    }
    componentWillUnmount() {
        this.stickyElementTracker.destroy();
    }

    render() {
        const {suggestions} = this.props;

        return (
            <div className={'dropdown open suggestions-dropdown'}
                ref={(el) => this.dropdownElement = el}
                style={{zIndex: 999, border: 'solid transparent', borderWidth: '6px 0'}}>
                <ul className={'dropdown__menu'} style={{position: 'static'}}>
                    {suggestions.length === 0 ? <li><button>SORRY, NO SUGGESTIONS.</button></li>
                        : suggestions.map((suggestion, index) =>
                            <li key={index}>
                                <button onMouseDown={this.replaceWord(suggestion.key)}>
                                    {suggestion.value}
                                </button>
                            </li>,
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
    word: PropTypes.object,
    suggestions: PropTypes.array,
    replaceWord: PropTypes.func,
    refreshWord: PropTypes.func,
    targetElement: PropTypes.object,
};

/**
 * @ngdoc method
 * @name SpellcheckerContextMenu#mapDispatchToProps
 * @param {Function} dispatch callback to store
 * @returns {Object} Returns the props values
 * @description Maps the values from state to the component callback type props.
 */
const mapDispatchToProps = (dispatch) => ({
    refreshWord: (word) => setTimeout(() => dispatch(actions.refreshWord(word)), 0),
    replaceWord: (word) => setTimeout(() => dispatch(actions.replaceWord(word)), 0),
});

export const SpellcheckerContextMenu: React.StatelessComponent<any> = connect(
    null,
    mapDispatchToProps,
)(SpellcheckerContextMenuComponent);
