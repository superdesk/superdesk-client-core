import * as React from 'react';
import {ISuperdesk, IArticle, IArticleQueryResult, IDesk, IArticleUpdateEvent, IUser} from 'superdesk-api';

interface IState {
    articles: IArticleQueryResult | null;
    desks: Array<IDesk> | null;
    user: IUser | null;
}

export function getMarkedForMeComponent(superdesk: ISuperdesk) {
    const {Badge} = superdesk.components;
    const {addEventListener, removeEventListener} = superdesk;

    return class MarkedForMe extends React.PureComponent<{}, IState> {
        constructor(props: {}) {
            super(props);

            this.state = {
                articles: null,
                desks: null,
                user: null,
            };

            this.queryAndSetArticles = this.queryAndSetArticles.bind(this);
            this.handleArticleUpdateEvent = this.handleArticleUpdateEvent.bind(this);
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
        private handleArticleUpdateEvent(event: IArticleUpdateEvent) {
            if (this.state.articles != null && this.state.articles._items.some(({_id}) => event.items[_id] != null)) {
                this.queryAndSetArticles();
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

            addEventListener('articleUpdate', this.handleArticleUpdateEvent);
        }
        componentWillUnmount() {
            removeEventListener('articleUpdate', this.handleArticleUpdateEvent);
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
                    desksInOrder.push(bucket.key);
                });
            }

            return (
                <DropdownTree
                    groups={desksInOrder.map((deskId) => ({
                        render: () => (
                            <div style={{
                                fontSize: 11,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: 0.08,
                                color: '#5D9BC0',
                                paddingTop: 16,
                                paddingBottom: 10,
                            }}>
                                <span className="badge badge--highlight" style={{marginRight: 6}}>
                                    {itemsByDesk[deskId].length}
                                </span>
                                {desks.find(({_id}) => _id === deskId)!.name}
                            </div>
                        ),
                        items: itemsByDesk[deskId],
                    }))}
                    getToggleElement={(isOpen, onClick) => (
                        <button onClick={onClick} style={{
                            background: isOpen ? '#F8F8F8' : '#3C3C3C',
                            color: isOpen ? '#000' : '#fff',
                            paddingLeft: 10,
                            paddingRight: 10,
                            zIndex: 2, // so button is on top of dropdown top shadow
                        }}>
                            <Badge type="highlight" marginRight={6}>{articles._items.length}</Badge>
                            {gettext('Marked for me')}
                        </button>
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
                            >
                                <ArticleItemConcise article={item} />
                            </button>
                        );
                    }}
                    wrapperStyles={{maxWidth: 430, padding: 15, paddingTop: 0}}
                />
            );
        }
    };
}
