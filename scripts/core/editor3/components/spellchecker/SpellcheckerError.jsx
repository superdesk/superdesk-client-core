import React, {Component} from 'react';
import {connect} from 'react-redux';
import ng from 'core/services/ng';
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
export class SpellcheckerErrorComponent extends Component {
    static getDecorators() {
        return [{
            strategy: spellcheckStrategy,
            component: SpellcheckerError
        }];
    }

    constructor(props) {
        super(props);

        this.onContextMenu = this.onContextMenu.bind(this);
    }

    onContextMenu(e) {
        e.preventDefault();

        const {children, showContextMenu} = this.props;
        const word = {text: children[0].props.text, offset: children[0].props.start};
        const position = {left: e.clientX - 20, top: e.clientY + 10};

        showContextMenu({word, position});
    }

    render() {
        return <span className="word-typo" onContextMenu={this.onContextMenu}>{this.props.children}</span>;
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
