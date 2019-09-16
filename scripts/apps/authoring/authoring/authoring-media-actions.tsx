import React from 'react';
import {IArticle} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';

interface IProps {
    article: IArticle;
}

export class AuthoringMediaActions extends React.PureComponent<IProps> {
    render() {
        const mediaActions = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.mediaActions != null
                    ? activationResult.contributions.mediaActions
                    : [],
        );

        // extensions should be able to expose pure components which check equality by reference
        const article = {...this.props.article};

        return (
            <div style={{paddingLeft: 4}}>
                {mediaActions.map(
                    (Component, i) =>
                        <Component key={i} article={article} />,
                )}
            </div>
        );
    }
}
