import ReactDOM from 'react-dom';
import React from 'react';
import {ContentBlock} from 'draft-js';
import ng from 'core/services/ng';
import {SpellcheckerContextMenu} from './SpellcheckerContextMenu';
import {ISpellcheckWarning, ISpellcheckerAction} from './interfaces';
import {ISpellcheckWarningsByBlock} from 'core/editor3/actions';

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

interface IState {
    menuShowing: boolean;
    warning: ISpellcheckWarning;
}

export const getSpellcheckingDecorator = (spellcheckWarnings: ISpellcheckWarningsByBlock) => {
    return {
        strategy: (contentBlock: ContentBlock, callback) => {
            const blockKey = contentBlock.getKey();

            if (spellcheckWarnings[blockKey] != null) {
                spellcheckWarnings[blockKey].forEach((warning) => {
                    callback(warning.startOffset, warning.startOffset + warning.text.length);
                });
            }
        },
        component: class SpellcheckerError extends React.Component<any, IState> {
            static propTypes: any;
            static defaultProps: any;

            wordTypoElement: any;

            constructor(props) {
                super(props);

                this.state = {
                    menuShowing: false,
                    warning: null,
                };

                this.closeContextMenu = this.closeContextMenu.bind(this);
            }

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
                const {menuShowing} = this.state;

                return (
                    <span
                        className="word-typo"
                        onContextMenu={(e) => {
                            e.preventDefault();

                            const blockKey = this.props.offsetKey.split('-')[0];
                            const warningsForBlock = spellcheckWarnings[blockKey];

                            if (warningsForBlock == null) {
                                return;
                            }

                            const startOffset = this.props.contentState
                                .getBlockForKey(blockKey)
                                .getText()
                                .indexOf(this.props.decoratedText);

                            const warningForDecoration = warningsForBlock.find((warning) =>
                                warning.startOffset === startOffset && warning.text === this.props.decoratedText);

                            if (Array.isArray(warningForDecoration.suggestions)) {
                                this.setState({
                                    menuShowing: true,
                                    warning: warningForDecoration,
                                });
                            } else {
                                getSuggestions(warningForDecoration.text).then((suggestions) => {
                                    this.setState({
                                        menuShowing: true,
                                        warning: {
                                            ...warningForDecoration,
                                            suggestions: suggestions == null ? [] : suggestions,
                                        },
                                    });
                                });
                            }
                        }}
                        ref={(el) => this.wordTypoElement = el}>
                        {menuShowing ?
                            ReactDOM.createPortal(
                                <SpellcheckerContextMenu
                                    targetElement={this.wordTypoElement}
                                    warning={this.state.warning}
                                />,
                                getElementForPortal(),
                            )
                            : null}
                        {this.props.children}
                    </span>
                );
            }
        },
    };
};

export function getSpellcheckWarnings(str: string): Promise<Array<ISpellcheckWarning>> {
    const spellcheck = ng.get('spellcheck');

    return spellcheck.getDict()
        .then(() => {
            const info: Array<ISpellcheckWarning> = [];
            const WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;
            const regex = WORD_REGEXP;

            let lastOffset = 0;

            str.split('\n').forEach((paragraph) => {
                let matchArr;
                let start;

                // tslint:disable-next-line no-conditional-assignment
                while ((matchArr = regex.exec(paragraph)) !== null) {
                    start = matchArr.index;
                    if (!spellcheck.isCorrectWord(matchArr[0])) {
                        info.push({
                            startOffset: lastOffset + start,
                            text: matchArr[0],
                            suggestions: null,
                        });
                    }
                }

                lastOffset += paragraph.length;
            });

            return info;
        });
}

export const spellcheckerActions: {[key: string]: ISpellcheckerAction} = {
    addToDictionary: {
        label: gettext('Add to dictionary'),
        perform: (warning: ISpellcheckWarning) => {
            return ng.getService('spellcheck').then((spellcheck) => {
                spellcheck.addWord(warning.text, false);
            });
        },
    },
    ignoreWord: {
        label: gettext('Ignore word'),
        perform: (warning: ISpellcheckWarning) => {
            return ng.getService('spellcheck').then((spellcheck) => {
                spellcheck.addWord(warning.text, false);
            });
        },
    },
};

export function getSuggestions(text: string): Promise<Array<string>> {
    return ng.getService('spellcheck')
        .then((spellcheck) => spellcheck.suggest(text))
        .then((result) => result.map(({value}) => value));
}
