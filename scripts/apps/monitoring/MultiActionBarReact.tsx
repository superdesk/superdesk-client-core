import React from 'react';

import {IExtensionActivationResult, IArticleActionBulk, IArticle} from 'superdesk-api';
import {flatMap, groupBy} from 'lodash';
import {extensions} from 'appConfig';
import {DropdownTree} from 'core/ui/components/dropdown-tree';
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
        getActionsBulk.map((getPromise) => getPromise(articles)),
    ).then((res) => flatMap(res).map((action) => ({...action, canAutocloseMultiActionBar: true})));
}

export class MultiActionBarReact extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};

        this.onTrigger = this.onTrigger.bind(this);
    }
    private onTrigger(action: IArticleActionBulkExtended) {
        if (action.canAutocloseMultiActionBar) {
            this.props.hideMultiActionBar();
        }

        action.onTrigger();
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

        if (this.props.compact) {
            return (
                <div className="right-stack" data-test-id="multi-actions-dropdown">
                    <DropdownTree
                        getToggleElement={(isOpen, onClick) => (
                            <button
                                onClick={onClick}
                                className="navbtn"
                                data-test-id="dropdown-toggle"
                            >
                                <i className="icon-dots-vertical" />
                            </button>
                        )}
                        groups={[{render: () => null, items: this.state.actions}]}
                        renderItem={(key, item, closeDropdown) => (
                            <button
                                key={key}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: 0,
                                    textAlign: 'left',
                                    whiteSpace: 'nowrap',
                                }}
                                onClick={() => {
                                    closeDropdown();
                                    this.onTrigger(item);
                                }}
                                data-test-id={item.label}
                            >
                                <span
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        padding: '10px',
                                    }}
                                >
                                    <i className={item.icon} style={{marginRight: 10}} />
                                    <span>{item.label}</span>
                                </span>
                            </button>
                        )}
                    />
                </div>
            );
        } else {
            const groups = groupBy(this.state.actions, (item) => item.group && item.group.label);
            const groupNames = Object.keys(groups);

            return (
                <div data-test-id="multi-actions-inline">
                    {
                        groupNames.map((group, i) => (
                            group === 'undefined') ?
                            groups[group].map((action, key) => (
                                <button
                                    onClick={() => {
                                        this.onTrigger(action);
                                    }}
                                    className="navbtn strict"
                                    title={action.label}
                                    key={key}
                                    data-test-id={action.label}
                                >
                                    <Icon className={action.icon} size={22} />
                                </button>
                            )) :
                            <DropdownTree
                                getToggleElement={(isOpen, onClick) => (
                                    <button
                                        onClick={onClick}
                                        className="navbtn"
                                        title={groups[group][0].group.label}
                                        data-test-id="dropdown-toggle"
                                    >
                                        <Icon className={groups[group][0].group.icon} size={22} />
                                    </button>
                                )}
                                inline={true}
                                key={i}
                                groups={[{render: () => null, items: groups[group]}]}
                                renderItem={(key, item, closeDropdown) => (
                                    <button
                                        key={key}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: 0,
                                            textAlign: 'left',
                                            whiteSpace: 'nowrap',
                                        }}
                                        onClick={() => {
                                            closeDropdown();
                                            this.onTrigger(item);
                                        }}
                                        data-test-id={item.label}
                                    >
                                        <span
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                alignItems: 'center',
                                                padding: '10px',
                                            }}
                                        >
                                            <i className={item.icon} style={{marginRight: 10}} />
                                            <span>{item.label}</span>
                                        </span>
                                    </button>
                                )}
                            />,
                        )
                    }
                </div>
            );
        }
    }
}
