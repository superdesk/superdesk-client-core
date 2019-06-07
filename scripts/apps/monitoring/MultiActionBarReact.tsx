import React from "react";

import { IExtensionActivationResult, IArticleActionBulk } from "superdesk-api";
import {flatMap} from "lodash";
import {extensions} from "core/extension-imports.generated";
import {IArticle} from "superdesk-interfaces/Article";
import {DropdownButton} from "core/ui/components/dropdownButton";

interface IProps {
    context: 'archive' | 'ingest';
    articles: Array<IArticle>;
    compact: boolean;
    getCoreActions(): Array<IArticleActionBulk>;
    hideMultiActionBar(): void;
}

interface IState {
    actions?: Array<IArticleActionBulk>;
}

function getActionsBulk(articles): Promise<Array<IArticleActionBulk>> {
    const getActionsBulkFromExtensions
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
        getActionsBulkFromExtensions.map((getPromise) => getPromise('include', articles)),
    ).then((res) => flatMap(res));
}

export class MultiActionBarReact extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        getActionsBulk(this.props.articles).then((actionsBulkFromExtensions) => {
            this.setState({
                actions: [].concat(actionsBulkFromExtensions).concat(this.props.getCoreActions()),
            });
        });
    }
    componentDidUpdate(prevProps) {
        // update when more items are selected / deselected
        if (prevProps !== this.props) {
            getActionsBulk(this.props.articles).then((actionsBulkFromExtensions) => {
                this.setState({
                    actions: [].concat(actionsBulkFromExtensions).concat(this.props.getCoreActions()),
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
                <div className="right-stack">
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
                        onSelect={(item) => {
                            item.onTrigger();
                        }}
                    />
                </div>
            );
        } else {
            return (
                <div>
                    {
                        this.state.actions.map((menuItem, i) => (
                            <button
                                onClick={() => {
                                    // this.props.hideMultiActionBar(); // multi edit needs to read selected items
                                    menuItem.onTrigger();
                                }}
                                className="navbtn strict"
                                title={menuItem.label}
                                key={i}
                            >
                                <i className={menuItem.icon} />
                            </button>
                        ))
                    }
                </div>
            );
        }
    }
}
