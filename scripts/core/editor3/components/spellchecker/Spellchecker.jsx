/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name Spellchecker
 * @param {Function} getEditorState
 * @param {Function} setEditorState
 * @param {Object} spellchecker
 * @param {Object} editorRect
 * @description check the text and shows the inline spellchecker context menu
 */

import React from 'react';
import {EditorState, Modifier} from 'draft-js';

export class Spellchecker extends React.Component {
    constructor(props) {
        super(props);

        this.addWord = this.addWord.bind(this);
        this.replaceWord = this.replaceWord.bind(this);

        this.isVisible = this.isVisible.bind(this);
    }

    /**
      * @ngdoc method
      * @name Spellchecker#getDecorator
      * @param {Function} getEditorState
      * @param {Function} setEditorState
      * @param {Object} spellchecker
      * @return {Object} returns the decorator
      * @description Decorator for spellchecker, will highlight the words with errors
      */
    static getDecorators(getEditorState, setEditorState, spellchecker) {
        return [{
            strategy: spellcheckStrategy(spellchecker.isCorrectWord),
            component: Spellchecker.spellcheckSpan,
            props: {
                getEditorState: getEditorState,
                setEditorState: setEditorState,
                spellchecker: spellchecker,
                showContextMenu: Spellchecker.showContextMenu
            }
        }];
    }

    /**
      * @ngdoc method
      * @name Spellchecker#spellcheckSpan
      * @return {Object} return the component used to highlight errors
      * @description Component to highlight errors
      */
    static spellcheckSpan(props) {
        const style = styleMap.ERROR;
        const onContextMenu = (e) => props.showContextMenu(e, props);

        return <span style={style} onContextMenu={onContextMenu}>{props.children}</span>;
    }

    /**
      * @ngdoc method
      * @name Spellchecker#showContextMenu
      * @param {Object} e on context menu event
      * @param {Object} the properties of the component that generates the event
      * @description Show the contextual menu, init the suggestions list
      */
    static showContextMenu(e, props) {
        const left = e.clientX;
        const top = e.clientY;
        var element = props.children[0];

        e.preventDefault();
        props.spellchecker.suggest(element.props.text)
        .then((suggestions) => {
            var {editorState} = props.getEditorState();

            props.setEditorState({
                spellcheckerState: {
                    suggestions: suggestions,
                    left: left - 20,
                    top: top + 20,
                    word: element.props.text,
                    start: element.props.start,
                    selection: editorState.getSelection()
                }
            });
        });
    }

    /**
      * @ngdoc method
      * @name Spellchecker#addWord
      * @param {String} word
      * @param {Boolean} isIgnored
      * @description Calls the dictionary ignore word action
      */
    addWord(word, isIgnored) {
        this.props.spellchecker.addWord(word, isIgnored);
        this.replaceWord(word);
    }

    /**
     * @ngdoc method
     * @name Spellchecker#replaceWord
     * @param {String} word
     * @description Replace the current word with the new selected one
     */
    replaceWord(word) {
        const {editorState, spellcheckerState} = this.props.getEditorState();
        var textSelection;
        var newContentState;
        var newEditorState;

        textSelection = spellcheckerState.selection.merge({
            anchorOffset: spellcheckerState.start,
            focusOffset: spellcheckerState.start + spellcheckerState.word.length
        });

        newContentState = Modifier.replaceText(editorState.getCurrentContent(), textSelection, word);
        newEditorState = EditorState.push(editorState, newContentState, 'spellchecker');
        this.props.setEditorState({editorState: newEditorState, spellcheckerState: null});
    }

    /**
     * @ngdoc method
     * @name Spellchecker#isVisible
     * @description Verify if the spellchecker contextual menu should be showed
     */
    isVisible() {
        const {editorState, spellcheckerState} = this.props.getEditorState();
        const selection = editorState.getSelection();

        if (!spellcheckerState) {
            return false;
        }

        if (selection === spellcheckerState.selection) {
            return true;
        }

        if (selection.anchorOffset !== spellcheckerState.selection.anchorOffset ||
            selection.focusOffset !== spellcheckerState.selection.focusOffset) {
            return false;
        }

        return true;
    }

    render() {
        if (!this.isVisible()) {
            return null;
        }

        const {spellcheckerState} = this.props.getEditorState();
        const position = {
            top: spellcheckerState.top - this.props.editorRect.top,
            left: spellcheckerState.left - this.props.editorRect.left,
            display: 'block'
        };

        return (
            <div className={'dropdown open'} style={position}>
                <ul className={'dropdown__menu'}>
                    {spellcheckerState.suggestions.length === 0 ?
                        <li><button>SORRY, NO SUGGESTIONS.</button></li>
                        :
                        spellcheckerState.suggestions.map((word, index) =>
                            <li key={index}>
                                <button onClick={() => this.replaceWord(word.key)}>
                                    {word.value}
                                </button>
                            </li>
                        )
                    }
                    <li className="divider"/>
                    <li>
                        <button onClick={() => this.addWord(spellcheckerState.word, false)}>
                            Add to dictionary
                        </button>
                    </li>
                    <li>
                        <button onClick={() => this.addWord(spellcheckerState.word, true)}>
                            Ignore word
                        </button>
                    </li>
                </ul>
            </div>
        );
    }
}

/**
  * @ngdoc method
  * @name Spellchecker#spellcheckStrategy
  * @return {Object} returns the spellchecker strategy
  * @description For a block check the words that has errors
  */
function spellcheckStrategy(isCorrectWord) {
    let WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;

    return (contentBlock, callback) => {
        const text = contentBlock.getText();
        let matchArr, start, regex = WORD_REGEXP;

        while ((matchArr = regex.exec(text)) !== null) {
            start = matchArr.index;
            if (!isCorrectWord(matchArr[0])) {
                callback(start, start + matchArr[0].length);
            }
        }
    };
}

/** Set the types of props for the editor */
Spellchecker.propTypes = {
    getEditorState: React.PropTypes.func,
    setEditorState: React.PropTypes.func,
    spellchecker: React.PropTypes.object,
    editorRect: React.PropTypes.object,
};

/** Custom overrides for "error" style. */
const styleMap = {
    ERROR: {
        borderBottomWidth: '1px',
        borderBottomStyle: 'dotted',
        borderBottomColor: 'red'
    }
};
