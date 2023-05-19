import React from 'react';
import {IArticle} from 'superdesk-api';
import {flatMap} from 'lodash';
import {extensions} from 'appConfig';
import {IArticleAction} from './services/AuthoringWorkspaceService';
import {registerToReceivePatches, unregisterFromReceivingPatches} from 'apps/authoring-bridge/receive-patches';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    article: IArticle;
    action: IArticleAction;
    onChange(article: IArticle): void;
}

interface IState {
    articleOriginal?: IArticle;
}

/**
 * Only used from angular based authoring.
 */
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
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({articleOriginal: undefined}, () => {
                this.fetchArticleFromServer();
            });
        }
    }
    componentDidMount() {
        if (this.props.action === 'view') {
            this.fetchArticleFromServer();
        } else {
            registerToReceivePatches(this.props.article._id, (patch) => {
                this.props.onChange({
                    ...this.props.article,
                    ...patch,
                });
            });
        }
    }
    componentWillUnmount() {
        unregisterFromReceivingPatches();
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
                    (widget, i) => {
                        const Component = widget.component;

                        return (
                            <span key={i} style={{marginRight: 10}}>
                                <Component
                                    article={
                                        this.props.action === 'view'
                                            ? this.state.articleOriginal
                                            : articleUpdatedReference
                                    }
                                />
                            </span>
                        );
                    },
                )}
            </div>
        );
    }
}
