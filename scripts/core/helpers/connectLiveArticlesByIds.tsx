import React from 'react';
import {IArticleQuery, IArticleQueryResult, IPropsConnectLiveArticlesByQuery} from 'superdesk-api';
import {dataApiByEntity} from './CrudManager';

interface IState {
    articles?: IArticleQueryResult;
}

export function connectLiveArticlesByQuery<T extends IPropsConnectLiveArticlesByQuery>(
    Component: React.ComponentType<T>,
    query: IArticleQuery,
): React.ComponentType<Omit<T, keyof IPropsConnectLiveArticlesByQuery>> {
    return class ConnectedLiveArticlesByIds extends React.PureComponent<T, IState> {
        constructor(props: T) {
            super(props);

            this.state = {};

            this.reloadArticles = this.reloadArticles.bind(this);
        }
        reloadArticles() {
            dataApiByEntity.article.query(query).then((articles) => {
                this.setState({articles});
            });
        }
        componentDidMount() {
            this.reloadArticles();

            window.addEventListener('websocket-message', (event: CustomEvent) => {
                if (
                    typeof event.detail === 'object'
                    && event.detail['event'] === 'content:update'
                    && typeof event.detail['extra'] === 'object'
                    && typeof event.detail['extra']['items'] === 'object'
                    && this.state.articles._items.some(({_id}) => event.detail['extra']['items'][_id] != null)
                ) {
                    this.reloadArticles();
                }
            });
        }
        render() {
            if (this.state.articles == null) {
                return null;
            }

            return <Component {...this.props} articles={this.state.articles} reload={this.reloadArticles} />;
        }
    };
}
