import React from 'react';
import {IArticle, IUser, IStage} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {SelectUser} from 'core/ui/components/SelectUser';
import {logger} from 'core/services/logger';
import {extensions} from 'appConfig';
import {Loader} from 'core/ui/components/Loader';
import {GroupComponent} from './Group';

type FetchFunction = (repo: string, criteria: any) => Promise<any>;

export interface IGroup {
    id: string;
    label: string;
    precondition?: () => boolean;
    dataSource:
        {repo: string, query: object}
        | ((f: FetchFunction) => Promise<any>);
    collapsed?: boolean;
}

export interface IGroupData {
    id: any;
    itemIds: any;
    itemsById: any;
    total: number;
}

interface IProps {
    header?: boolean;
    user: IUser;
    onUserChange(user: IUser): void;
}

interface IState {
    userSearchField: string;
    groups: Array<IGroup> | null;
    groupsData: Array<IGroupData> | null;
    loading: boolean;
}

function genericFetch({search, api}, repo, filters) {
    let query = search.query();

    query.clear_filters();
    query.size(200).filter(filters);

    let criteria = query.getCriteria(true);

    criteria.repo = repo;
    criteria.source.from = 0;
    criteria.source.size = 200;

    return api.query('search', criteria);
}

function getQueryLockedByUser(userId) {
    return {
        term: {
            lock_user: userId,
        },
    };
}

function getQueryNotLockedByMe(userId) {
    return {
        bool: {
            must_not: {
                term: {
                    lock_user: userId,
                },
            },
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
                    {...getQueryNotLockedByMe(userId)},
                ];

                if (markedQuery != null) {
                    mustQuery.push({...markedQuery});
                }

                return ng.get('desks').fetchStages().then((stages) => {
                    const incomingStages = stages._items
                        .filter(({default_incoming}) => default_incoming === true)
                        .map(({_id}) => _id);

                    const isNotOnIncomingStage: any = {
                        bool: {
                            must_not: {
                                terms: {
                                    'task.stage': incomingStages,
                                },
                            },
                        },
                    };

                    mustQuery.push({...isNotOnIncomingStage});

                    return fetchFn('archive', {
                        bool: {
                            must: mustQuery,
                        },
                    });
                });
            },
        },
        {
            id: 'moved',
            label: gettext('Moved to a working stage by this user'),
            dataSource(fetchFn) {
                return ng.get('desks').fetchStages().then((stages) => {
                    const workingStages = stages._items
                        .filter(({working_stage}) => working_stage === true)
                        .map(({_id}) => _id);

                    const inOnWorkingStage: any = {
                        terms: {
                            'task.stage': workingStages,
                        },
                    };

                    const movedByUser = [
                        {match: {'task.user': userId}},
                        {term: {operation: 'move'}},
                    ];

                    return fetchFn(
                        'archive_history',
                        {
                            bool: {
                                must: [
                                    ...movedByUser,
                                    inOnWorkingStage,
                                ],
                            },
                        },
                    );
                });
            },
        },
    ];
};

export default class UserActivityWidget extends React.Component<IProps, IState> {
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
        this.toggleCollapseExpand = this.toggleCollapseExpand.bind(this);
        this.updateGroupDataOnUserChange = this.updateGroupDataOnUserChange.bind(this);
    }

    componentDidMount() {
        this.addListeners();

        this.updateGroupDataOnUserChange(this.props.user);
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.user._id !== prevProps.user._id) {
            this.updateGroupDataOnUserChange(this.props.user);
        }
    }

    componentWillUnmount() {
        this.removeListeners.forEach((remove) => remove());
    }

    toggleCollapseExpand(group: IGroup) {
        const newGroups = this.state.groups.map((g) => {
            if (g.id === group.id) {
                return {...g, collapsed: !g.collapsed};
            }

            return g;
        });

        this.setState({
            groups: newGroups,
        });
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
        if (this.props.user) {
            this.fetchGroupsData();
        }
    }

    fetchItems(group: IGroup): Promise<IGroupData> {
        const {api, search} = this.services;
        const promise = typeof group.dataSource === 'function'
            ? group.dataSource((repo, filters) => genericFetch({search, api}, repo, filters))
            : genericFetch({search, api}, group.dataSource.repo, group.dataSource.query);

        return promise.then((res) => {
            const itemIds = [];
            const itemsById = {};

            for (const item of res._items) {
                itemIds.push(item._id);
                itemsById[item._id] = item;
            }

            const groupData: IGroupData = {
                id: group.id,
                itemIds,
                itemsById,
                total: res._meta.total,
            };

            return groupData;
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

    updateGroupDataOnUserChange(user: IUser) {
        this.setState(
            {groups: GET_GROUPS(user._id, this.services), loading: true},
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
                    {this.props.header ? (
                        <div className="widget-header">
                            <h3 className="widget-title">
                                {gettext('User Activity')}
                            </h3>
                        </div>
                    ) : null}
                    <div
                        className="search-box search-box--no-shadow search-box--fluid-height"
                    >
                        <form className="search-box__content">
                            <SelectUser
                                selectedUserId={this.props.user?._id}
                                autoFocus={false}
                                onSelect={(user) => {
                                    this.props.onUserChange(user);
                                }}
                                horizontalSpacing={true}
                            />
                        </form>
                    </div>
                    {
                        loading ? <Loader /> :
                            this.state.groupsData && (
                                <div className="content-list-holder">
                                    <div className="shadow-list-holder">
                                        <div className="content-list">
                                            {
                                                this.state.groups.map((group) => {
                                                    const {groupsData} = this.state;
                                                    const data = groupsData.find((g) => g.id === group.id);

                                                    if (!data) {
                                                        logger.warn(
                                                            `Tried to render group '${group.id}' but no data was found`,
                                                        );
                                                        return null;
                                                    }

                                                    return (
                                                        <div key={`user-activity-${group.id}`}>
                                                            <GroupComponent
                                                                group={group}
                                                                data={data}
                                                                toggleCollapseExpand={this.toggleCollapseExpand}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            )}
                </div>
            </div>
        );
    }
}
