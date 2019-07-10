import * as React from 'react';
import {ISuperdesk, IArticle, IArticleQueryResult, IDesk} from 'superdesk-api';

interface IProps {
    articles: IArticleQueryResult;
    reload(): void;
    desks: Array<IDesk>;
}

export function getMarkedForMeComponent(superdesk: ISuperdesk) {
    const {Badge} = superdesk.components;
    const {connectLiveArticlesByQuery} = superdesk.experimental;

    class MarkedForMe extends React.PureComponent<IProps> {
        render() {
            const {articles, desks} = this.props;

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
    }

    return class MarkedForMeWrapper extends React.PureComponent<void, {desks: Array<IDesk> | null}> {
        MarkedForMeConnected: React.ComponentType<{desks: Array<IDesk>}> | null;

        constructor(props: void) {
            super(props);

            this.MarkedForMeConnected = null;

            this.state = {
                desks: null,
            };
        }

        componentDidMount() {
            Promise.all([
                superdesk.dataApi.query<IDesk>('desks', 1, {field: '_id', direction: 'ascending'}, {}),
                superdesk.session.getCurrentUser(),
            ]).then((res) => {
                const [desks, user] = res;

                this.MarkedForMeConnected = connectLiveArticlesByQuery<IProps>(
                    MarkedForMe,
                    {
                        page: {from: 0},
                        sort: [{'_updated': 'desc'}],
                        filterValues: {marked_for_user: [user._id]},
                    },
                );

                this.setState({desks: desks._items});
            });
        }
        render() {
            const {MarkedForMeConnected} = this;
            const {desks} = this.state;

            if (desks == null || MarkedForMeConnected == null) {
                return null;
            }

            return (
                <MarkedForMeConnected desks={desks} />
            );
        }
    };
}
