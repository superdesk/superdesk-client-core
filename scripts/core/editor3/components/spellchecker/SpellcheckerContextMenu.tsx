import React, {Fragment} from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {StickElementsWithTracking} from 'core/helpers/dom/stickElementsWithTracking';
import {
    ISpellcheckWarning,
    ISpellchecker,
    ISpellcheckerSuggestion
} from './interfaces';
import {reloadSpellcheckerWarnings} from '../../actions';

interface IProps {
    warning: ISpellcheckWarning;
    targetElement: any;
    spellchecker: ISpellchecker;
    dispatch: any;
}

export class SpellcheckerContextMenuComponent extends React.Component<IProps> {
    stickyElementTracker: any;
    dropdownElement: any;

    componentDidMount() {
        this.stickyElementTracker = new StickElementsWithTracking(this.props.targetElement, this.dropdownElement);
    }
    componentWillUnmount() {
        this.stickyElementTracker.destroy();
    }

    onSuggestionClick(suggestion: ISpellcheckerSuggestion) {
        this.props.dispatch(
            actions.replaceWord({
                word: {
                    text: this.props.warning.text,
                    offset: this.props.warning.startOffset,
                },
                newWord: suggestion.text,
            }),
        );
    }

    render() {
        const {suggestions, message} = this.props.warning;
        const {spellchecker} = this.props;

        // If the message exists, use it as the button text
        // instead of the suggestion
        const messageExists = Boolean(message);

        return (
            <div className={'dropdown open suggestions-dropdown'}
                ref={(el) => this.dropdownElement = el}
                style={{zIndex: 999, border: 'solid transparent', borderWidth: '6px 0'}}
                data-test-id="spellchecker-menu"
            >
                <ul className={'dropdown__menu'} style={{position: 'static'}}>
                    {messageExists &&
                        <Fragment>
                            <div style={{margin: '0 16px'}}>{message}</div>
                            <li className="dropdown__menu-divider"/>
                        </Fragment>
                    }
                    <div className="form-label" style={{margin: '0 16px'}}>{gettext('Suggestions')}</div>
                    {
                        suggestions.length === 0
                            ? <li><button>{gettext('SORRY, NO SUGGESTIONS.')}</button></li>
                            : suggestions.map((suggestion, index) =>
                                <li key={index}>
                                    <button
                                        onMouseDown={() =>
                                            this.onSuggestionClick(suggestion)
                                        }
                                        data-test-id="spellchecker-menu--suggestion"
                                    >
                                        {suggestion.text}
                                    </button>
                                </li>,
                            )
                    }
                    {
                        Object.keys(spellchecker.actions).length < 1 ? null : (
                            <div>
                                <li className="divider"/>
                                <div className="form-label" style={{margin: '0 16px'}}>{gettext('Actions')}</div>
                                {
                                    Object.keys(spellchecker.actions).map((key, i) => {
                                        const action = spellchecker.actions[key];

                                        return (
                                            <li key={i}>
                                                <button
                                                    onMouseDown={() => action.perform(this.props.warning).then(
                                                        () => {
                                                            this.props.dispatch(reloadSpellcheckerWarnings());
                                                        },
                                                    )}
                                                    data-test-id="spellchecker-menu--action"
                                                >
                                                    {action.label}
                                                </button>
                                            </li>
                                        );
                                    })
                                }
                            </div>
                        )
                    }
                </ul>
            </div>
        );
    }
}

export const SpellcheckerContextMenu = connect()(SpellcheckerContextMenuComponent);
