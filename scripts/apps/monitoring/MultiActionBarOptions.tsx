import React from "react";
import { IExtensionActivationResult, IArticleActionBulk } from "superdesk-api";
import { flatMap } from "lodash";
import { extensions } from "core/extension-imports.generated";
import { IArticle } from "superdesk-interfaces/Article";

interface IProps {
    articles: Array<IArticle>;
    hideMultiActionBar(): void;
}

interface IState {
    actionsBulkFromExtensions?: Array<IArticleActionBulk>;
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

export class MultiActionBarOptions extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        getActionsBulk(this.props.articles).then((actionsBulkFromExtensions) => {
            this.setState({
                actionsBulkFromExtensions,
            });
        });
    }
    componentDidUpdate(prevProps) {
        // update when more items are selected / deselected
        if (prevProps !== this.props) {
            getActionsBulk(this.props.articles).then((actionsBulkFromExtensions) => {
                this.setState({
                    actionsBulkFromExtensions,
                });
            });
        }
    }
    render() {
        if (this.state.actionsBulkFromExtensions == null) {
            return null;
        }

        return (
            <div>
                {
                    this.state.actionsBulkFromExtensions.map((menuItem, i) => (
                        <button
                            onClick={() => {
                                this.props.hideMultiActionBar();
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
