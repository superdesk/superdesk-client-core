import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    // couldn't take the entire article as a prop
    // because it would lose fields(at least an `_id`) when converted to JSON string
    articleId: string;
}

interface IState {
    article?: IArticle;
}

export class AuthoringTopbarReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};
    }
    componentDidMount() {
        dataApi.findOne<IArticle>('archive', this.props.articleId).then((article) => {
            this.setState({article});
        });
    }
    render() {
        if (this.state.article === undefined) {
            return null;
        }

        const articleDisplayWidgets = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.authoringTopbarWidgets != null
                    ? activationResult.contributions.authoringTopbarWidgets
                    : [],
        );

        return (
            <div style={{paddingLeft: 10}}>
                {articleDisplayWidgets.map((Component, i) => <Component key={i} article={this.state.article} />)}
            </div>
        );
    }
}
