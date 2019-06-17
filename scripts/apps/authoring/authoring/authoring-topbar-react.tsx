import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';

interface IProps {
    article: IArticle;
}

export class AuthoringTopbarReact extends React.PureComponent<IProps> {
    render() {
        const articleDisplayWidgets = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.authoringTopbarWidgets != null
                    ? activationResult.contributions.authoringTopbarWidgets
                    : [],
        );

        return (
            <div>
                {articleDisplayWidgets.map((Component, i) => <Component key={i} article={this.props.article} />)}
            </div>
        );
    }
}
