import React from 'react';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {StickElementsWithTracking} from 'core/helpers/dom/stickElementsWithTracking';
import {spellcheckerActions} from './SpellcheckerDecorator';
import {ISpellcheckWarning} from './interfaces';
import {reloadSpellcheckerWarnings} from '../../actions';

interface IProps {
    warning: ISpellcheckWarning;
    targetElement: any;
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

    render() {
        const {suggestions} = this.props.warning;

        return (
            <div className={'dropdown open suggestions-dropdown'}
                ref={(el) => this.dropdownElement = el}
                style={{zIndex: 999, border: 'solid transparent', borderWidth: '6px 0'}}
            >
                <ul className={'dropdown__menu'} style={{position: 'static'}}>
                    <div className="form-label" style={{margin: '0 16px'}}>{gettext('Suggestions')}</div>
                    {suggestions.length === 0 ? <li><button>{gettext('SORRY, NO SUGGESTIONS.')}</button></li>
                        : suggestions.map((suggestion, index) =>
                            <li key={index}>
                                <button onMouseDown={() => {
                                    this.props.dispatch(actions.replaceWord({
                                        word: {text: this.props.warning.text, offset: this.props.warning.startOffset},
                                        newWord: suggestion,
                                    }));
                                }}>
                                    {suggestion}
                                </button>
                            </li>,
                        )
                    }
                    <li className="divider"/>
                    <div className="form-label" style={{margin: '0 16px'}}>{gettext('Actions')}</div>
                    {
                        Object.keys(spellcheckerActions).map((key, i) => {
                            const action = spellcheckerActions[key];

                            return (
                                <li key={i}>
                                    <button
                                        onMouseDown={() => action.perform(this.props.warning).then(
                                            () => {
                                                this.props.dispatch(reloadSpellcheckerWarnings());
                                            },
                                        )}
                                    >
                                        {action.label}
                                    </button>
                                </li>
                            );
                        })
                    }

                </ul>
            </div>
        );
    }
}

export const SpellcheckerContextMenu = connect()(SpellcheckerContextMenuComponent);
