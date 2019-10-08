import * as React from 'react';
import {ISuperdesk, IArticle, IArticleQueryResult, IDesk, IUser} from 'superdesk-api';

function noop() {
    //
}

interface IState {
    articles: IArticleQueryResult | null;
    desks: Array<IDesk> | null;
    user: IUser | null;
}

export function getMarkedForMeComponent(superdesk: ISuperdesk) {
    const {Badge, GroupLabel, TopMenuDropdownButton} = superdesk.components;

    return class MarkedForMe extends React.PureComponent<{}, IState> {
        private removeMarkedListener: () => void;
        private removeUnmarkedListener: () => void;

        constructor(props: {}) {
            super(props);

            this.state = {
                articles: null,
                desks: null,
                user: null,
            };

            this.queryAndSetArticles = this.queryAndSetArticles.bind(this);

            this.removeMarkedListener = noop;
            this.removeUnmarkedListener = noop;
        }
        private queryAndSetArticles() {
            const {user} = this.state;

            if (user != null) {
                superdesk.dataApiByEntity.article.query({
                    page: {from: 0},
                    sort: [{'_updated': 'desc'}],
                    filterValues: {marked_for_user: [user._id]},
                }).then((articles) => {
                    this.setState({articles});
                });
            }
        }
        componentDidMount() {
            Promise.all([
                superdesk.dataApi.query<IDesk>('desks', 1, {field: '_id', direction: 'ascending'}, {}),
                superdesk.session.getCurrentUser(),
            ]).then((res) => {
                const [desksResponse, user] = res;

                this.setState({desks: desksResponse._items, user});

                this.queryAndSetArticles();
            });

            this.removeMarkedListener = superdesk.addWebsocketMessageListener('item:marked', this.queryAndSetArticles);
            this.removeUnmarkedListener = superdesk.addWebsocketMessageListener(
                'item:unmarked',
                this.queryAndSetArticles,
            );
        }
        componentWillUnmount() {
            this.removeMarkedListener();
            this.removeUnmarkedListener();
        }
        render() {
            const {articles, desks} = this.state;

            if (articles === null || desks == null) {
                return null;
            }

            const {gettext} = superdesk.localization;
            const {getClass} = superdesk.utilities.CSS;

            const DropdownTree = superdesk.components.getDropdownTree<IArticle>();
            const {ArticleItemConcise} = superdesk.components;

            const itemsByDesk: {[id: string]: Array<IArticle>} = {};

            articles._items.forEach((item) => {
                if (item.task != null && item.task.desk != null) {
                    if (typeof itemsByDesk[item.task.desk] === 'undefined') {
                        itemsByDesk[item.task.desk] = [];
                    }

                    itemsByDesk[item.task.desk].push(item);
                }
            });

            const desksInOrder: Array<string> = [];

            if (articles._aggregations.desk != null) {
                articles._aggregations.desk.buckets.forEach((bucket) => {
                    // Skip non-ID aggregations SDESK-4497
                    if (itemsByDesk[bucket.key] != null) {
                        desksInOrder.push(bucket.key);
                    }
                });
            }

            return (
                <DropdownTree
                    groups={desksInOrder.map((deskId) => ({
                        render: () => (
                            <GroupLabel>
                                <Badge type="highlight" marginRight={6}>{itemsByDesk[deskId].length}</Badge>
                                {desks.find(({_id}) => _id === deskId)!.name}
                            </GroupLabel>
                        ),
                        items: itemsByDesk[deskId],
                    }))}
                    getToggleElement={(isOpen, onClick) => (
                        <TopMenuDropdownButton
                            onClick={() => {
                                if (desksInOrder.length > 0) {
                                    onClick();
                                }
                            }}
                            active={isOpen}
                            data-test-id="toggle-button"
                        >
                            <Badge type="highlight" marginRight={6}>{articles._items.length}</Badge>
                            {gettext('Marked for me')}
                        </TopMenuDropdownButton>
                    )}
                    renderItem={(key, item, closeDropdown) => {
                        return (
                            <button
                                key={key}
                                style={{display: 'block', width: '100%', padding: 0, textAlign: 'left'}}
                                className={getClass('article-in-dropdown')}
                                onClick={() => {
                                    closeDropdown();
                                    superdesk.ui.article.view(item._id);
                                }}
                                data-test-id="item"
                            >
                                <ArticleItemConcise article={item} />
                            </button>
                        );
                    }}
                    wrapperStyles={{width: 430, padding: 15, paddingTop: 0}}
                    data-test-id="marked-for-me-dropdown"
                />
            );
        }
    };
}
