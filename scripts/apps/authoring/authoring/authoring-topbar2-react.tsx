import React from 'react';
import {IArticle, IAuthoringActionType} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'appConfig';
import {dataApi} from 'core/helpers/CrudManager';
import {CreatedInfo} from './created-info';
import {ModifiedInfo} from './modified-info';

const defaultToolbarItems: Array<React.ComponentType<{article: IArticle}>> = [CreatedInfo, ModifiedInfo];

interface IProps {
    article: IArticle;
    action: IAuthoringActionType;
    onChange(article: IArticle): void;
}

interface IState {
    articleOriginal?: IArticle;
}

/**
 * Only used from angular based authoring view
 */
export class AuthoringTopbar2React extends React.PureComponent<IProps, IState> {
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
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({articleOriginal: undefined}, () => {
                this.fetchArticleFromServer();
            });
        }
    }
    componentDidMount() {
        if (this.props.action === 'view') {
            this.fetchArticleFromServer();
        }
    }
    render() {
        if (this.props.action === 'view' && typeof this.state.articleOriginal === 'undefined') {
            return null; // fetching article from the server
        }

        const articleDisplayWidgets = defaultToolbarItems.concat(
            flatMap(
                Object.values(extensions),
                (extension) => extension.activationResult?.contributions?.authoringTopbar2Widgets ?? [],
            ),
        );

        // extensions should be able to expose pure components which check equality by reference
        const articleUpdatedReference = {...this.props.article};

        return (
            <div className="authoring-sticky__detailed-wrapper">
                {articleDisplayWidgets.map(
                    (Component, i) => (
                        <div key={i} className="authoring-sticky__from-extensions">
                            <Component
                                article={
                                    this.props.action === 'view' ? this.state.articleOriginal : articleUpdatedReference
                                }
                            />
                        </div>
                    ),
                )}
            </div>
        );
    }
}
