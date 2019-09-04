import React from 'react';
import {IArticle} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'core/extension-imports.generated';
import {IAuthoringAction} from './services/AuthoringWorkspaceService';
import {registerInternalExtension, unregisterInternalExtension} from 'core/helpers/register-internal-extension';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    article: IArticle;
    action: IAuthoringAction;
    onChange(article: IArticle): void;
}

interface IState {
    articleOriginal?: IArticle;
}

const authoringTopBarExtensionName = 'authoring-top-bar';

export class AuthoringTopbarReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {};

        this.fetchArticleFromServer = this.fetchArticleFromServer.bind(this);
    }
    fetchArticleFromServer() {
        // fetching original item from the server since `IProps['article']` contains changes
        // which it shouldn't contain since it is in read-only mode.
        // I've tried passing `origItem` from authoring-topbar, but it contains changes as well,
        // namely `_editable` and `_locked` fields which doesn't allow for computing correct diff.
        dataApi.findOne<IArticle>('archive', this.props.article._id).then((articleOriginal) => {
            this.setState({articleOriginal});
        });
    }
    componentDidUpdate(prevProps: IProps) {
        if (this.props.action === 'view' && JSON.stringify(prevProps.article) !== JSON.stringify(this.props.article)) {
            this.setState({articleOriginal: undefined}, () => {
                this.fetchArticleFromServer();
            });
        }
    }
    componentDidMount() {
        if (this.props.action === 'view') {
            this.fetchArticleFromServer();
        } else {
            registerInternalExtension(authoringTopBarExtensionName, {
                contributions: {
                    entities: {
                        article: {
                            onUpdateBefore: (article) => {
                                if (this.props.article._id === article._id) {
                                    this.props.onChange(article);
                                    console.info('Article is locked and can\'t be updated via HTTP directly.'
                                    + 'The updates will be added to existing diff in article-edit view instead.');

                                    return Promise.reject();
                                } else {
                                    return Promise.resolve(article);
                                }
                            },
                        },
                    },
                },
            });
        }
    }
    componentWillUnmount() {
        unregisterInternalExtension(authoringTopBarExtensionName);
    }
    render() {
        if (this.props.action === 'view' && typeof this.state.articleOriginal === 'undefined') {
            return null; // fetching article from the server
        }

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
                        <Component
                            key={i}
                            article={
                                this.props.action === 'view' ? this.state.articleOriginal : articleUpdatedReference
                            }
                        />,
                )}
            </div>
        );
    }
}
