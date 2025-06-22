import React from 'react';
import {connect} from 'react-redux';
import {Card, Icon, Spacer} from 'superdesk-ui-framework/react';
import * as actions from '../../actions';
import {
    ISpellcheckWarning,
    ISpellchecker,
    ISpellcheckerSuggestion,
} from './interfaces';
import {gettext} from 'core/utils';
import {dispatchInternalEvent} from 'core/internal-events';
import {IReplaceWordData} from 'core/editor3/reducers/spellchecker';

export type IAcceptSuggestion = 'store-based' | ((replaceWordData: IReplaceWordData) => void);

interface IProps {
    warning: ISpellcheckWarning;
    targetElement: any;
    spellchecker: ISpellchecker;
    dispatch: any;
    acceptSuggestion: IAcceptSuggestion;
}

export class SpellcheckerContextMenuComponent extends React.Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this.onSuggestionClick = this.onSuggestionClick.bind(this);
    }

    onSuggestionClick(suggestion: ISpellcheckerSuggestion) {
        const replaceWordData: IReplaceWordData = {
            word: {
                text: this.props.warning.text,
                offset: this.props.warning.startOffset,
            },
            newWord: suggestion.text,
        };

        if (this.props.acceptSuggestion === 'store-based') {
            this.props.dispatch(
                actions.replaceWord(replaceWordData),
            );
        } else {
            this.props.acceptSuggestion(replaceWordData);
        }
    }

    render() {
        const {suggestions, explanation} = this.props.warning;
        const {spellchecker} = this.props;

        return (
            <Card
                paddingBase="0"
                paddingBlockStart="var(--space--1)"
                paddingBlockEnd="var(--space--0-5)"
                style={{display: 'flex', flexDirection: 'column', maxWidth: 300, maxHeight: 500, zIndex: 9999}}
                data-test-id="spellchecker-menu"
            >
                {explanation != null && (
                    <React.Fragment>
                        <div className="form-label" style={{margin: '0 var(--space--1)'}}>
                            {gettext('Explanation')}
                        </div>

                        <div
                            style={{
                                padding: '0 var(--space--1)',
                                maxHeight: '5lh',
                                flexShrink: 0,
                                overflowY: 'auto',
                                marginBottom: 'var(--space--0-5)',
                            }}
                        >
                            {explanation}
                        </div>

                        <div className="divider" style={{marginBlockStart: 0}} />
                    </React.Fragment>
                )}

                <div className="form-label" style={{margin: '0 var(--space--1)'}}>
                    {gettext('Suggestions')}
                </div>

                {
                    suggestions.length === 0
                        ? (
                            <div style={{margin: '0 var(--space--1)', marginBottom: 'var(--space--0-5)'}}>
                                {gettext('No suggestions available')}
                            </div>
                        )
                        : (
                            <div style={{flexShrink: 1, overflow: 'auto'}}>
                                {
                                    suggestions.map((suggestion, index) => (
                                        <button
                                            onMouseDown={() =>
                                                this.onSuggestionClick(suggestion)
                                            }
                                            data-test-id="spellchecker-menu--suggestion"
                                            className="sd-dropdown-item"
                                            key={index}
                                        >
                                            {suggestion.text}
                                        </button>
                                    ))
                                }
                            </div>
                        )
                }

                {
                    Object.keys(spellchecker.actions).length < 1 ? null : (
                        <div style={{flexGrow: 1}}>
                            <div className="divider" style={{marginBlockStart: 0}} />

                            <div className="form-label" style={{margin: '0 var(--space--1)'}}>
                                {gettext('Actions')}
                            </div>

                            {
                                Object.keys(spellchecker.actions).map((key, i) => {
                                    const action = spellchecker.actions[key];

                                    return (
                                        <button
                                            onMouseDown={() => {
                                                action.perform(this.props.warning).then(() => {
                                                    dispatchInternalEvent(
                                                        'editor3SpellcheckerActionWasExecuted',
                                                        null,
                                                    );
                                                });
                                            }}
                                            data-test-id="spellchecker-menu--action"
                                            className="sd-dropdown-item"
                                            key={i}
                                        >
                                            <Spacer h gap="8" justifyContent="start" noWrap key={i}>
                                                {
                                                    action.icon != null && (
                                                        <Icon name={action.icon} />
                                                    )
                                                }

                                                <span>{action.label}</span>
                                            </Spacer>
                                        </button>
                                    );
                                })
                            }
                        </div>
                    )
                }
            </Card>
        );
    }
}

export const SpellcheckerContextMenu = connect()(SpellcheckerContextMenuComponent);
