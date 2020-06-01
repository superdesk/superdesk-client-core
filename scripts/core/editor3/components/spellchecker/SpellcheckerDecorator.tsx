import ReactDOM from 'react-dom';
import React from 'react';
import {ContentBlock, EditorState} from 'draft-js';
import {SpellcheckerContextMenu} from './SpellcheckerContextMenu';
import {ISpellcheckWarning, ISpellchecker} from './interfaces';
import {getSpellchecker} from './default-spellcheckers';
import {logger} from 'core/services/logger';
import {assertNever} from 'core/helpers/typescript-helpers';
import {IPropsDraftDecorator} from 'core/editor3/draftjs-types';

export type ISpellcheckWarningsByBlock = {[blockKey: string]: Array<ISpellcheckWarning>};

export function getSpellcheckWarningsByBlock(
    spellchecker: ISpellchecker,
    editorState: EditorState,
): Promise<ISpellcheckWarningsByBlock> {
    const text = editorState.getCurrentContent().getPlainText();

    if (text.length < 1) {
        return Promise.resolve({});
    }

    const rangesByBlock: Array<{blockKey: string, startOffset: number, endOffset: number}> = [];

    let lastOffset = 0;
    const blocks = editorState.getCurrentContent().getBlocksAsArray();

    blocks.forEach((block) => {
        const blockLength = block.getLength();
        const lineBreak = 1;

        rangesByBlock.push({
            blockKey: block.getKey(), startOffset: lastOffset, endOffset: lastOffset + blockLength,
        });
        lastOffset += blockLength + lineBreak;
    });

    return spellchecker.check(text).then((warnings) => {
        let spellcheckWarningsByBlock: ISpellcheckWarningsByBlock = {};

        warnings.forEach((warning) => {
            const range = rangesByBlock.find(({startOffset, endOffset}) =>
                warning.startOffset >= startOffset && warning.startOffset < endOffset);

            if (range == null) {
                logger.warn('Can not find a range for a spellchecker warning', {text, warnings, warning});
                return;
            }

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

export function getSpellcheckingDecorator(
    language: string,
    spellcheckWarnings: ISpellcheckWarningsByBlock,
    {disableContextMenu = false} = {},
) {
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
        component: class SpellcheckerError extends React.Component<IPropsDraftDecorator, IState> {
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

                const blockKey = this.props.offsetKey.split('-')[0];
                const warningsForBlock = spellcheckWarnings[blockKey];

                if (warningsForBlock == null) {
                    return <span>{this.props.children}</span>;
                }

                // props.start isn't available in the latest release yet
                // it's fixed in https://github.com/facebook/draft-js/commit/8000486ed6890d1f69100379d954a62ac8a4eb08
                const {start} = this.props.children[0].props;
                const {decoratedText} = this.props;

                const warningForDecoration = warningsForBlock.find((warning) =>
                    warning.startOffset === start && warning.text === decoratedText);

                if (warningForDecoration == null) {
                    return <span>{this.props.children}</span>;
                }

                const getClassname = () => {
                    if (warningForDecoration.type === 'spelling') {
                        return 'spelling-error';
                    } else if (warningForDecoration.type === 'grammar') {
                        return 'grammar-error';
                    } else {
                        assertNever(warningForDecoration.type);
                    }
                };

                return (
                    <span
                        className={getClassname()}
                        onContextMenu={(e) => {
                            if (disableContextMenu) {
                                return;
                            }

                            e.preventDefault();

                            if (Array.isArray(warningForDecoration.suggestions)) {
                                this.setState({
                                    menuShowing: true,
                                    warning: warningForDecoration,
                                });
                            } else if (spellchecker != null && typeof spellchecker.getSuggestions === 'function') {
                                spellchecker.getSuggestions(warningForDecoration.text).then((suggestions) => {
                                    this.setState({
                                        menuShowing: true,
                                        warning: {
                                            ...warningForDecoration,
                                            suggestions: suggestions == null ? [] : suggestions,
                                        },
                                    });
                                });
                            } else {
                                this.setState({
                                    menuShowing: true,
                                    warning: {
                                        ...warningForDecoration,
                                        suggestions: [],
                                    },
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
}
