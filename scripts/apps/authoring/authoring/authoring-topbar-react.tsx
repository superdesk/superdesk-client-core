import React from 'react';
import {IArticle} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {registerInternalExtension, unregisterInternalExtension} from 'core/helpers/register-internal-extension';

interface IProps {
    article: IArticle;
    onChange(article: IArticle): void;
}

const authoringTopBarExtensionName = 'authoring-top-bar';

export class AuthoringTopbarReact extends React.PureComponent<IProps> {
    componentDidMount() {
        registerInternalExtension(authoringTopBarExtensionName, {
            contributions: {
                entities: {
                    article: {
                        onUpdateBefore: (article) => {
                            this.props.onChange(article);
                            console.info("Article is locked and can't be updated via HTTP directly."
                            + 'The updates will be added to existing diff in article-edit view instead.');
                            return Promise.reject();
                        },
                    },
                },
            },
        });
    }
    componentWillUnmount() {
        unregisterInternalExtension(authoringTopBarExtensionName);
    }
    render() {
        const articleDisplayWidgets = flatMap(
            Object.values(extensions).map(({activationResult}) => activationResult),
            (activationResult) =>
                activationResult.contributions != null
                && activationResult.contributions.authoringTopbarWidgets != null
                    ? activationResult.contributions.authoringTopbarWidgets
                    : [],
        );

        // extensions should be able to expose pure components which check equality by reference
        const articleUpdatedReference = {...this.props.article};

        return (
            <div style={{paddingLeft: 10}}>
                {articleDisplayWidgets.map(
                    (Component, i) =>
                        <Component key={i} article={articleUpdatedReference} />,
                )}
            </div>
        );
    }
}
