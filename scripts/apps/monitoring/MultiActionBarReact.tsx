import React from 'react';

import {IExtensionActivationResult, IArticleActionBulk} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {IArticle} from 'superdesk-interfaces/Article';
import {DropdownButton} from 'core/ui/components/dropdownButton';
import {Icon} from 'core/ui/components/Icon2';
import {sortByDisplayPriority} from 'core/helpers/sortByDisplayPriority';

export interface IArticleActionBulkExtended extends IArticleActionBulk {
    // this is possible for all extensions since they don't depend on external state
    // most of core actions are relying on service state which would be destroyed if we closed the bar too early
    // when `canAutocloseMultiActionBar` set to false, core actions close it themselves when they are done
    canAutocloseMultiActionBar: boolean;
}

interface IProps {
    context: 'archive' | 'ingest';
    articles: Array<IArticle>;
    compact: boolean;
    getCoreActions(articles: Array<IArticle>): Array<IArticleActionBulkExtended>;
    hideMultiActionBar(): void;
}

interface IState {
    actions?: Array<IArticleActionBulkExtended>;
}

function getActionsBulkFromExtensions(articles): Promise<Array<IArticleActionBulkExtended>> {
    const getActionsBulk
    : Array<IExtensionActivationResult['contributions']['entities']['article']['getActionsBulk']>
    = flatMap(
        Object.values(extensions).map(({activationResult}) => activationResult),
        (activationResult) =>
            activationResult.contributions != null
            && activationResult.contributions.entities != null
            && activationResult.contributions.entities.article != null
            && activationResult.contributions.entities.article.getActionsBulk != null
                ? activationResult.contributions.entities.article.getActionsBulk
                : [],
    );

    return Promise.all(
        getActionsBulk.map((getPromise) => getPromise('include', articles)),
    ).then((res) => flatMap(res).map((action) => ({...action, canAutocloseMultiActionBar: true})));
}

export class MultiActionBarReact extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        getActionsBulkFromExtensions(this.props.articles).then((actionsBulkFromExtensions) => {
            this.setState({
                actions: sortByDisplayPriority(
                    this.props.getCoreActions(this.props.articles).concat(actionsBulkFromExtensions),
                ),
            });
        });
    }
    componentDidUpdate(prevProps) {
        // update when more items are selected / deselected
        if (prevProps !== this.props) {
            getActionsBulkFromExtensions(this.props.articles).then((actionsBulkFromExtensions) => {
                this.setState({
                    actions: sortByDisplayPriority(
                        this.props.getCoreActions(this.props.articles).concat(actionsBulkFromExtensions),
                    ),
                });
            });
        }
    }
    render() {
        if (this.state.actions == null) {
            return null;
        }

        const onTrigger = (action: IArticleActionBulkExtended) => {
            if (action.canAutocloseMultiActionBar) {
                this.props.hideMultiActionBar();
            }

            action.onTrigger();
        };

        if (this.props.compact) {
            return (
                <div className="right-stack" data-test-id="multi-select-dropdown">
                    <DropdownButton
                        getToggleElement={(onClick) => (
                            <button onClick={onClick} className="navbtn"><i className="icon-dots-vertical" /></button>
                        )}
                        items={this.state.actions}
                        renderItem={(item) => (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <i className={item.icon} style={{marginRight: 10}} />
                                <span>{item.label}</span>
                            </div>
                        )}
                        getItemLabel={(item) => item.label}
                        onSelect={onTrigger}
                    />
                </div>
            );
        } else {
            return (
                <div data-test-id="multi-select-inline">
                    {
                        this.state.actions.map((action, i) => (
                            <button
                                onClick={() => {
                                    onTrigger(action);
                                }}
                                className="navbtn strict"
                                title={action.label}
                                key={i}
                                data-test-id={action.label}
                            >
                                <Icon className={action.icon} size={22} />
                            </button>
                        ))
                    }
                </div>
            );
        }
    }
}
