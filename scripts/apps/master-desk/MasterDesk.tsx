import React from 'react';
import ng from 'core/services/ng';
import {IDesk, IStage, IUser} from 'superdesk-api';

import {HeaderComponent} from './components/HeaderComponent';
import {OverviewComponent} from './components/OverviewComponent';
import UsersComponent from './components/UsersComponent';
import {AssignmentsComponent} from './components/AssignmentsComponent';
import {PreviewComponent} from './components/PreviewComponent';
import {FilterPanelComponent} from './components/FilterPanelComponent';
import {FilterBarComponent} from './components/FilterBarComponent';

import {assertNever} from 'core/helpers/typescript-helpers';
import {gettext} from 'core/utils';
import {appConfig} from 'appConfig';

import UserActivityWidget from 'apps/dashboard/user-activity/components/UserActivityWidget';

export enum IMasterDeskTab {
    overview = 'overview',
    users = 'users',
    assignments = 'assignments',
}

export const USER_PREFERENCE_SETTINGS = 'masterdesk:desks';

export function getLabelForMasterDeskTab(tab: IMasterDeskTab): string {
    switch (tab) {
    case IMasterDeskTab.overview:
        return gettext('Overview');
    case IMasterDeskTab.users:
        return gettext('Users');
    case IMasterDeskTab.assignments:
        return gettext('Assignments');
    default:
        return assertNever(tab);
    }
}

interface IState {
    desks: Array<IDesk>;
    stages: Array<IStage>;
    currentTab: IMasterDeskTab;
    filterOpen: boolean;
    activeUser: IUser;
    planning: boolean;
    deskFilter: string;
    filters: any;
}

export class MasterDesk extends React.Component<{}, IState> {
    services: any;

    constructor(props) {
        super(props);

        this.state = {
            currentTab: IMasterDeskTab.overview,
            filterOpen: false,
            desks: [],
            stages: [],
            activeUser: null,
            planning: false,
            deskFilter: '',
            filters: {},
        };

        this.services = {
            desks: ng.get('desks'),
            preferences: ng.get('preferencesService'),
        };
    }

    componentDidMount() {
        this.services.preferences.get(USER_PREFERENCE_SETTINGS).then((desks) => {
            desks && (desks.showAllDesks || desks.showAllDesks === undefined) ?
                this.getDeskList() :
                this.getDeskList(desks.items);
        });

        if (appConfig?.apps?.includes('superdesk-planning')) {
            this.setState({planning: true});
        }
    }

    getDeskList(enabledDeskIds?: Array<string>, showAll?: boolean) {
        const desks = this.services.desks;

        desks.initialize().then(() => {
            this.setState({stages: desks.deskStages});

            let filteredDesks;

            enabledDeskIds && !showAll ?
                filteredDesks = desks.desks._items.filter((item) => enabledDeskIds.includes(item._id)) :
                filteredDesks = desks.desks._items;

            this.setState({desks: filteredDesks});
        });
    }

    isFilterAllowed() {
        return this.state.currentTab === IMasterDeskTab.overview;
    }

    render() {
        return (
            <div className="sd-content-wrapper__main-content-area sd-main-content-grid">
                <HeaderComponent
                    activeTab={this.state.currentTab}
                    desks={this.state.desks}
                    isPlaningActive={this.state.planning}
                    isFilterAllowed={this.isFilterAllowed()}
                    isFilterOpened={this.state.filterOpen}
                    onTabChange={(tab) => this.setState({currentTab: tab})}
                    onUpdateDeskList={(desks, showAll) => this.getDeskList(desks, showAll)}
                    onFilterOpen={(filter) => this.setState({filterOpen: filter})}
                />

                {this.isFilterAllowed() ? (
                    <FilterPanelComponent
                        open={this.state.filterOpen}
                        onDeskFilterChange={(desk) => this.setState({deskFilter: desk})}
                        onFilterChange={(filters) => this.setState({filters: filters})}
                    />
                )
                    : null}

                <div className="sd-main-content-grid__content">
                    {this.isFilterAllowed() ? (
                        <FilterBarComponent
                            filters={this.state.filters}
                            onFilterChange={(filters) => this.setState({filters: filters})}
                        />
                    )
                        : null}

                    <div className="sd-main-content-grid__content-inner">
                        {(() => {
                            switch (this.state.currentTab) {
                            case IMasterDeskTab.overview:
                                return (
                                    <OverviewComponent
                                        desks={this.state.desks}
                                        stages={this.state.stages}
                                        deskFilter={this.state.deskFilter}
                                        filters={this.state.filters}
                                        onFilterChange={(filters) => this.setState({filters: filters})}
                                    />
                                );
                            case IMasterDeskTab.users:
                                return (
                                    <UsersComponent
                                        desks={this.state.desks}
                                        onUserSelect={(user) => this.setState({activeUser: user})}
                                    />
                                );
                            case IMasterDeskTab.assignments:
                                return (
                                    <AssignmentsComponent
                                        desks={this.state.desks}
                                        stages={this.state.stages}
                                    />
                                );
                            default:
                                return assertNever(this.state.currentTab);
                            }
                        })()}
                    </div>
                </div>
                {this.state.activeUser ? (
                    <PreviewComponent header={'User Activity'} onClose={() => this.setState({activeUser: null})}>
                        <UserActivityWidget
                            user={this.state.activeUser}
                            onUserChange={(user) => this.setState({activeUser: user})}
                        />
                    </PreviewComponent>
                ) : null}
            </div>
        );
    }
}
