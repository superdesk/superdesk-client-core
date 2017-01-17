import React, {Component} from 'react';
import ng from 'core/services/ng';
import {SpellcheckerContextMenu} from './SpellcheckerContextMenu';
import classNames from 'classnames';

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerError
 * @param {Array} children the children prop of the component
 * @param {Function} showContextMenu callback to show the spellchecker context menu for current word
 * @description The words with spellcheck errors are enclosed in this component in order to highlight
 * the error and allow the opening of the contextual spellchecker menu.
 */
export class SpellcheckerError extends Component {
    static getDecorators() {
        return [{
            strategy: spellcheckStrategy,
            component: SpellcheckerError
        }];
    }

    constructor(props) {
        super(props);

        this.state = {
            menuShowing: false,
            suggestions: [],
            ignored: false
        };

        this.showContextMenu = this.showContextMenu.bind(this);
        this.closeContextMenu = this.closeContextMenu.bind(this);
        this.onIgnore = this.onIgnore.bind(this);
    }

    showContextMenu(txt) {
        const spellcheck = ng.get('spellcheck');

        return (e) => {
            e.preventDefault();

            spellcheck.suggest(txt).then((suggestions) => {
                this.setState({menuShowing: true, suggestions: suggestions});
            });
        };
    }

    closeContextMenu() {
        this.setState({menuShowing: false});
    }

    onIgnore() {
        this.setState({ignored: true});
    }

    componentDidUpdate(prevProps, prevState) {
        const {menuShowing} = this.state;

        if (prevState.menuShowing === menuShowing) {
            return;
        }

        const fn = menuShowing ? 'on' : 'off';

        $(window)[fn]('mousedown', this.closeContextMenu);
    }

    componentWillUnmount() {
        $(window).off('mousedown', this.closeContextMenu);
    }

    render() {
        const {menuShowing, suggestions, ignored} = this.state;
        const {children} = this.props;
        const word = {text: children[0].props.text, offset: children[0].props.start};
        const cx = classNames({'word-typo': true, ignored: ignored});

        return (
            <span className={cx} onContextMenu={this.showContextMenu(word.text)}>
                {menuShowing ?
                    <SpellcheckerContextMenu suggestions={suggestions} word={word} onIgnore={this.onIgnore} />
                    : null}
                {this.props.children}
            </span>
        );
    }
}

/**
 * @description For a block check the words that has errors
 */
function spellcheckStrategy(contentBlock, callback) {
    const spellcheck = ng.get('spellcheck');
    const WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;
    const text = contentBlock.getText();

    let matchArr, start, regex = WORD_REGEXP;

    while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index;
        if (!spellcheck.isCorrectWord(matchArr[0])) {
            callback(start, start + matchArr[0].length);
        }
    }
}


/** Set the types of props for the spellchecker error component*/
SpellcheckerError.propTypes = {
    children: React.PropTypes.array
};
