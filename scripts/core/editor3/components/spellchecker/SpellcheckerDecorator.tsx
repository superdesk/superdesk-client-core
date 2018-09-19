import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';
import ng from 'core/services/ng';
import {SpellcheckerContextMenu} from './SpellcheckerContextMenu';

function getElementForPortal() {
    const existingElement = document.querySelector('.spellchecker-suggestions');

    if (existingElement != null) {
        return existingElement;
    } else {
        const newElement = document.createElement('div');

        newElement.classList.add('spellchecker-suggestions');
        document.body.appendChild(newElement);

        return newElement;
    }
}

/**
 * @ngdoc React
 * @module superdesk.core.editor3
 * @name SpellcheckerError
 * @param {Array} children the children prop of the component
 * @description This is the component that decorates spellchecker typos.
 */
class SpellcheckerError extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    wordTypoElement: any;

    constructor(props) {
        super(props);

        this.state = {
            menuShowing: false,
            suggestions: [],
        };

        this.showContextMenu = this.showContextMenu.bind(this);
        this.closeContextMenu = this.closeContextMenu.bind(this);
    }

    /**
     * @ngdoc method
     * @name SpellcheckerError#showContextMenu
     * @param {String} txt The word that suggestions are being showed for.
     * @returns {Function} The event listener
     * @description Creates a new event listener that shows the context menu
     * for the passed word.
     */
    showContextMenu(txt) {
        const spellcheck = ng.get('spellcheck');

        return (e) => {
            e.preventDefault();

            spellcheck.suggest(txt).then((suggestions) => {
                this.setState({menuShowing: true, suggestions: suggestions});
            });
        };
    }

    /**
     * @ngdoc method
     * @name SpellcheckerError#closeContextMenu
     * @description Closes the context menu.
     */
    closeContextMenu() {
        this.setState({menuShowing: false});
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
        const {menuShowing, suggestions} = this.state;
        const {children} = this.props;
        const word = {text: children[0].props.text, offset: children[0].props.start};

        return (
            <span
                className="word-typo"
                onContextMenu={this.showContextMenu(word.text)}
                ref={(el) => this.wordTypoElement = el}>
                {menuShowing ?
                    ReactDOM.createPortal(
                        <SpellcheckerContextMenu
                            targetElement={this.wordTypoElement}
                            suggestions={suggestions}
                            word={word}
                        />,
                        getElementForPortal(),
                    )
                    : null}
                {this.props.children}
            </span>
        );
    }
}

SpellcheckerError.propTypes = {
    children: PropTypes.array,
};

export const SpellcheckerDecorator = {
    strategy: spellcheckStrategy,
    component: SpellcheckerError,
};

/**
 * @description The function that defines the strategy to identify ranges of text that
 * should be highlighted as spellchecker typos.
 */
function spellcheckStrategy(contentBlock, callback) {
    const spellcheck = ng.get('spellcheck');
    const WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;
    const text = contentBlock.getText();

    let matchArr;
    let start;
    const regex = WORD_REGEXP;

    // tslint:disable-next-line no-conditional-assignment
    while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index;
        if (!spellcheck.isCorrectWord(matchArr[0])) {
            callback(start, start + matchArr[0].length);
        }
    }
}
