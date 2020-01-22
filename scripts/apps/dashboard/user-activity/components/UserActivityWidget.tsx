import React from 'react';
import {WidgetItemList} from 'apps/search/components';
import {IArticle, IUser, IStage} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {SelectUser} from 'core/ui/components/SelectUser';
import {logger} from 'core/services/logger';

interface IGroup {
    id: string;
    label: string;
    repo?: string; // not used if self.query is a function
    // pass the query or build multiple queries with the provided function
    query: any | ((fetchFn: (repo: string, criteria: any) => Promise<any>) => Promise<any>);
    collapsed?: boolean;
}

interface IState {
    searchOpen: boolean;
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

function getQueryMarkedForUser(userId) {
    return {
        term: {
            marked_for_user: userId,
        },
    };
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

function getQueryNotMarkedOrMarkedForMe(userId) {
    return {
        bool: {
            should: [
                {
                    bool: {
                        must_not: {
                            exists: {
                                field: 'marked_for_user',
                            },
                        },
                    },
                },
                {...getQueryMarkedForUser(userId)},
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
            repo: 'archive',
            query: {...getQueryLockedByUser(userId)},
        },
        {
            id: 'marked',
            label: gettext('Marked for this user'),
            repo: 'archive',
            query: {...getQueryMarkedForUser(userId)},
        },
        {
            id: 'created',
            label: gettext('Created by this user'),
            repo: 'archive',
            query(fetchFn) {
                return fetchFn('archive', {
                    bool: {
                        must: [
                            {...getQueryCreatedByUser(userId)},
                            {...getQueryNotMarkedOrMarkedForMe(userId)},
                            {...getQueryNotLockedOrLockedByMe(userId)},
                        ],
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
            query(fetchFn) {
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
        };

        this.state = {
            userSearchField: '',
            searchOpen: true,
            groups: null,
            groupsData: null,
            loading: false,
        };

        this.refreshItems = this.refreshItems.bind(this);
    }

    componentDidMount() {
        this.addListeners();
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

    async fetchItems(group: IGroup) {
        const {api, search} = this.services;
        const {_items} = typeof group.query === 'function'
            ? await group.query((repo, filters) => genericFetch({search, api}, repo, filters))
            : await genericFetch({search, api}, group.repo, group.query);

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
    }

    fetchGroupsData() {
        const {groups} = this.state;
        const promises = groups.map((group) => this.fetchItems(group));

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
                            select={angular.noop}
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

    render() {
        const {loading} = this.state;

        return (
            <div className="widget-container">
                <div className="main-list" style={{top: 0}}>
                    <div className="widget-header">
                        <button
                            className="widget-header__search-button"
                            onClick={() =>
                                this.setState({
                                    searchOpen: !this.state.searchOpen,
                                })
                            }
                        >
                            <i className="icon-search" />
                        </button>
                        <div className="widget-title">
                            {gettext('User Activity')}
                        </div>
                    </div>
                    <div
                        className={`search-box search-box--no-shadow search-box--fluid-height ${
                            this.state.searchOpen ? '' : 'search-box--hidden'
                        }`}
                    >
                        <form className="search-box__content">
                            <SelectUser
                                selectedUserId={this.state.user?._id}
                                focus={false}
                                onSelect={(user) => {
                                    this.setState(
                                        {user, groups: GET_GROUPS(user._id, this.services), loading: true},
                                        () => {
                                            this.fetchGroupsData();
                                        },
                                    );
                                }}
                            />
                        </form>
                    </div>
                    {
                        loading ? <div className="item-group__loading" /> :
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
