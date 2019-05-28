import ReactDOM from 'react-dom';
import React from 'react';
import {ContentBlock, EditorState} from 'draft-js';
import {SpellcheckerContextMenu} from './SpellcheckerContextMenu';
import {ISpellcheckWarning, ISpellchecker} from './interfaces';
import {getSpellchecker} from './default-spellcheckers';

export type ISpellcheckWarningsByBlock = {[blockKey: string]: Array<ISpellcheckWarning>};

export function getSpellcheckWarningsByBlock(
    spellchecker: ISpellchecker,
    editorState: EditorState,
): Promise<ISpellcheckWarningsByBlock> {
    const rangesByBlock: Array<{blockKey: string, startOffset: number, endOffset: number}> = [];

    let lastOffset = 0;
    const blocks = editorState.getCurrentContent().getBlocksAsArray();

    blocks.forEach((block) => {
        const blockLength = block.getLength();

        rangesByBlock.push({
            blockKey: block.getKey(), startOffset: lastOffset, endOffset: lastOffset + blockLength,
        });
        lastOffset += blockLength;
    });

    const text = editorState.getCurrentContent().getPlainText();

    if (text.length < 1) {
        return Promise.resolve({});
    } else {
        return spellchecker.check(text).then((warnings) => {
            let spellcheckWarningsByBlock: ISpellcheckWarningsByBlock = {};

            warnings.forEach((warning) => {
                const range = rangesByBlock.find(({startOffset, endOffset}) =>
                    warning.startOffset >= startOffset && warning.startOffset < endOffset);

                const {blockKey} = range;

                if (spellcheckWarningsByBlock[blockKey] == null) {
                    spellcheckWarningsByBlock[blockKey] = [];
                }
                spellcheckWarningsByBlock[blockKey].push({
                    ...warning,
                    startOffset: warning.startOffset - range.startOffset,
                });
            });

            return spellcheckWarningsByBlock;
        });
    }
}

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

export const getSpellcheckingDecorator = (language: string, spellcheckWarnings: ISpellcheckWarningsByBlock) => {
    const spellchecker = getSpellchecker(language);

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
                                spellchecker.getSuggestions(warningForDecoration.text).then((suggestions) => {
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
                        ref={(el) => this.wordTypoElement = el}
                        data-test-id="spellchecker-warning"
                    >
                        {menuShowing ?
                            ReactDOM.createPortal(
                                <SpellcheckerContextMenu
                                    targetElement={this.wordTypoElement}
                                    warning={this.state.warning}
                                    spellchecker={spellchecker}
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
