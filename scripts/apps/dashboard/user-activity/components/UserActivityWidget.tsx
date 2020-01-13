import React from 'react';
import {WidgetItemList} from 'apps/search/components';
import {IArticle, IUser} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services';
import ng from 'core/services/ng';
import {dataApi} from 'core/helpers/CrudManager';
import {gettext} from 'core/utils';
import {SelectUser} from 'core/ui/components/SelectUser';

interface IGroup {
    id: string;
    label: string;
    repo: string;
    query: any;
    collapsed?: boolean;
}

interface IState {
    searchOpen: boolean;
    userSearchField: string;
    user?: IUser;
    groups: Array<IGroup> | null;
    groupsData: Array<{ id; itemIds; itemsById }> | null;
}

const GET_GROUPS = (userId): Array<IGroup> => {
    return [
        {
            id: 'locked',
            label: gettext('Locked by this user'),
            repo: 'archive',
            query: {lock_user: userId},
        },
        {
            id: 'marked',
            label: gettext('Marked for this user'),
            repo: 'archive',
            query: {marked_for_user: userId},
        },
        {
            id: 'created',
            label: gettext('Created by this user'),
            repo: 'archive',
            query: {original_creator: userId},
        },
        // TODO:
        // {
        //     id: 'moved',
        //     label: gettext('Moved to a working stage by this user'),
        //     repo: 'archive',
        //     query: {},
        // },
    ];
};

export default class UserActivityWidget extends React.Component<{}, IState> {
    services: any;

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
        };
    }

    async fetchItems(group: IGroup) {
        const {_items} = await dataApi.query(
            group.repo,
            1,
            null,
            group.query,
        );

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
            this.setState({groupsData: data});
        });
    }

    renderGroup(group: IGroup) {
        const {groups, groupsData} = this.state;
        const data = groupsData.find((g) => g.id === group.id);

        if (!data) {
            console.warn(
                `Tried to render group '${group.id}' but no data was found`,
            );
            return null;
        }

        return (
            <>
                <div className="stage">
                    <div className="stage-header">
                        <button
                            className={`stage-header__toggle ${
                                group.collapsed ? 'closed' : ''
                            }`}
                            onClick={() => {
                                const newGroups = groups.map((g) => {
                                    if (g.id === group.id) {
                                        g.collapsed = !g.collapsed;
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
                    {group.collapsed || (
                        <div className="stage-content">
                            <WidgetItemList
                                customUIMessages={{
                                    empty: gettext('No results for this user'),
                                }}
                                allowed={true}
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
            </>
        );
    }

    render() {
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
                                        {user, groups: GET_GROUPS(user._id)},
                                        () => {
                                            this.fetchGroupsData();
                                        },
                                    );
                                }}
                            />
                        </form>
                    </div>
                    {this.state.user && this.state.groupsData && (
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
