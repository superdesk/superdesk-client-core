import React from 'react';
import {WidgetItemList} from 'apps/search/components';
import {IArticle, IUser, IStage} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {SelectUser} from 'core/ui/components/SelectUser';
import {logger} from 'core/services/logger';
import {extensions} from 'appConfig';
import {Loader} from 'core/ui/components/Loader';

type FetchFunction = (repo: string, criteria: any) => Promise<any>;

interface IGroup {
    id: string;
    label: string;
    precondition?: () => boolean;
    dataSource:
        {repo: string, query: object}
        | ((f: FetchFunction) => Promise<any>);
    collapsed?: boolean;
}

interface IState {
    userSearchField: string;
    user?: IUser;
    groups: Array<IGroup> | null;
    groupsData: Array<{ id; itemIds; itemsById }> | null;
    loading: boolean;
}

function genericFetch({search, api}, repo, filters) {
    let query = search.query();

    query.clear_filters();
    query.size(1).filter(filters);

    let criteria = query.getCriteria(true);

    criteria.repo = repo;

    return api.query('search', criteria);
}

function getQueryLockedByUser(userId) {
    return {
        term: {
            lock_user: userId,
        },
    };
}

function getQueryNotLockedOrLockedByMe(userId) {
    return {
        bool: {
            should: [
                {
                    bool: {
                        must_not: {
                            exists: {
                                field: 'lock_user',
                            },
                        },
                    },
                },
                {...getQueryLockedByUser(userId)},
            ],
        },
    };
}

function getQueryCreatedByUser(userId) {
    return {
        terms: {
            original_creator: [userId],
        },
    };
}

function getQueryMovedByUser(userId) {
    return {
        bool: {
            must: [
                {match: {'task.user': userId}},
                {term: {operation: 'move'}},
            ],
        },
    };
}

const GET_GROUPS = (userId, services: any): Array<IGroup> => {
    return [
        {
            id: 'locked',
            label: gettext('Locked by this user'),
            dataSource: {
                repo: 'archive',
                query: {...getQueryLockedByUser(userId)},
            },
        },
        {
            id: 'marked',
            label: gettext('Marked for this user'),
            precondition() {
                return extensions.hasOwnProperty('markForUser');
            },
            dataSource(fetchFn) {
                const query = extensions['markForUser'].extension.exposes.getQueryMarkedForUser(userId);

                return fetchFn('archive', query);
            },
        },
        {
            id: 'created',
            label: gettext('Created by this user'),
            dataSource(fetchFn) {
                const markedQuery = extensions['markForUser']
                    ?.extension
                    .exposes
                    .getQueryNotMarkedForAnyoneOrMarkedForMe(userId);

                const mustQuery = [
                    {...getQueryCreatedByUser(userId)},
                    {...getQueryNotLockedOrLockedByMe(userId)},
                ];

                if (markedQuery != null) {
                    mustQuery.push({...markedQuery});
                }

                return fetchFn('archive', {
                    bool: {
                        must: mustQuery,
                    },
                }).then((res) => {
                    res._items = res._items.filter(filterOutItemsInIncomingStage(services));

                    return res;
                });
            },
        },
        {
            id: 'moved',
            label: gettext('Moved to a working stage by this user'),
            dataSource(fetchFn) {
                return fetchFn('archive_history', {...getQueryMovedByUser(userId)})
                    .then((res) => {
                        res._items = res._items.filter(onlyHistoryItemsInWorkingStage(services));

                        return res;
                    });
            },
        },
    ];
};

function onlyHistoryItemsInWorkingStage({desks}) {
    return (historyItem) => {
        const stage = getStageForItem(historyItem, {desks});

        return stage.working_stage === true;
    };
}

function filterOutItemsInIncomingStage({desks}) {
    return (item) => {
        const stage = getStageForItem(item, {desks});

        return stage.default_incoming === false;
    };
}

function getStageForItem(item, {desks}) {
    const stageId = item.task?.stage;

    if (!stageId) {
        return false;
    }

    const stage = desks.stageLookup[stageId] || null;

    if (!stage) {
        console.warn('Tried to find a stage with an invalid id', stageId);
    }

    return stage;
}

export default class UserActivityWidget extends React.Component<{}, IState> {
    services: any;
    removeListeners: Array<() => void>;

    constructor(props) {
        super(props);

        this.services = {
            $anchorScroll: ng.get('$anchorScroll'),
            $location: ng.get('$location'),
            $q: ng.get('$q'),
            $rootScope: ng.get('$rootScope'),
            $timeout: ng.get('$timeout'),
            activityService: ng.get('activityService'),
            api: ng.get('api'),
            authoringWorkspace: ng.get(
                'authoringWorkspace',
            ) as AuthoringWorkspaceService,
            cards: ng.get('cards'),
            datetime: ng.get('datetime'),
            desks: ng.get('desks'),
            metadata: ng.get('metadata'),
            search: ng.get('search'),
            superdesk: ng.get('superdesk'),
            session: ng.get('session'),
        };

        this.state = {
            userSearchField: '',
            groups: null,
            groupsData: null,
            loading: false,
        };

        this.refreshItems = this.refreshItems.bind(this);
        this.setUser = this.setUser.bind(this);
    }

    componentDidMount() {
        this.addListeners();

        if (this.state.user == null) {
            this.setState({loading: true});

            this.services.session.getIdentity().then((user) => {
                this.setUser(user);
            });
        }
    }

    componentWillUnmount() {
        this.removeListeners.forEach((remove) => remove());
    }

    addListeners() {
        this.removeListeners = [
            'item:lock',
            'item:unlock',
            'item:spike',
            'item:move',
            'item:publish',
            'item:update',
        ].map((event) =>
            this.services.$rootScope.$on(event, this.refreshItems),
        );
    }

    refreshItems() {
        if (this.state.user) {
            this.fetchGroupsData();
        }
    }

    fetchItems(group: IGroup): Promise<{
        id: string,
        itemIds: Array<string>,
        itemsById: Array<{[id: string]: IArticle}>
    }> {
        const {api, search} = this.services;
        const promise = typeof group.dataSource === 'function'
            ? group.dataSource((repo, filters) => genericFetch({search, api}, repo, filters))
            : genericFetch({search, api}, group.dataSource.repo, group.dataSource.query);

        return promise.then(({_items}) => {
            const itemIds = [];
            const itemsById = {};

            for (const item of _items) {
                itemIds.push(item._id);
                itemsById[item._id] = item;
            }

            return {
                id: group.id,
                itemIds,
                itemsById,
            };
        });
    }

    fetchGroupsData() {
        const {groups} = this.state;
        const promises = groups
            .filter((group) => {
                if (group.precondition != null) {
                    const shouldBeEnabled = group.precondition();

                    return shouldBeEnabled;
                }

                return true;
            })
            .map((group) => this.fetchItems(group));

        Promise.all(promises).then((data) => {
            this.setState({groupsData: data, loading: false});
        });
    }

    renderGroup(group: IGroup) {
        const {groups, groupsData} = this.state;
        const data = groupsData.find((g) => g.id === group.id);

        if (!data) {
            logger.warn(
                `Tried to render group '${group.id}' but no data was found`,
            );
            return null;
        }

        return (
            <div className="stage">
                <div className="stage-header">
                    <button
                        className={`stage-header__toggle ${group.collapsed ? 'closed' : ''}`}
                        onClick={() => {
                            const newGroups = groups.map((g) => {
                                if (g.id === group.id) {
                                    return {...g, collapsed: !g.collapsed};
                                }

                                return g;
                            });

                            this.setState({
                                groups: newGroups,
                            });
                        }}
                    >
                        <i className="icon-chevron-down-thin" />
                    </button>
                    <span className="stage-header__name">
                        {group.label}
                    </span>
                    <div className="stage-header__line" />
                    <span className="label-total stage-header__number">
                        {data.itemIds.length}
                    </span>
                </div>
                {group.collapsed === true ? null : (
                    <div className="stage-content">
                        <WidgetItemList
                            customUIMessages={{
                                empty: gettext('No results for this user'),
                            }}
                            canEdit={true}
                            svc={this.services}
                            preview={(item: IArticle) => {
                                this.services.superdesk.intent(
                                    'preview',
                                    'item',
                                    item,
                                );
                            }}
                            select={(item: IArticle) => {
                                this.services.superdesk.intent(
                                    'preview',
                                    'item',
                                    item,
                                );
                            }}
                            edit={(item: IArticle) => {
                                this.services.authoringWorkspace.edit(item);
                            }}
                            itemIds={data.itemIds}
                            itemsById={data.itemsById}
                            loading={false}
                        />
                    </div>
                )}
            </div>
        );
    }

    setUser(user: IUser) {
        this.setState(
            {user, groups: GET_GROUPS(user._id, this.services), loading: true},
            () => {
                this.fetchGroupsData();
            },
        );
    }

    render() {
        const {loading} = this.state;

        return (
            <div className="widget-container">
                <div className="main-list" style={{top: 0}}>
                    <div className="widget-header">
                        <div className="widget-title">
                            {gettext('User Activity')}
                        </div>
                    </div>
                    <div
                        className="search-box search-box--no-shadow search-box--fluid-height"
                    >
                        <form className="search-box__content">
                            <SelectUser
                                selectedUserId={this.state.user?._id}
                                autoFocus={false}
                                onSelect={(user) => {
                                    this.setUser(user);
                                }}
                                horizontalSpacing={true}
                            />
                        </form>
                    </div>
                    {
                        loading ? <Loader /> :
                            this.state.user && this.state.groupsData && (
                                <div className="content-list-holder">
                                    <div className="shadow-list-holder">
                                        <div className="content-list">
                                            {this.state.groups.map((group) => (
                                                <div key={`user-activity-${group.id}`}>
                                                    {this.renderGroup(group)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                </div>
            </div>
        );
    }
}
