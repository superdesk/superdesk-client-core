import React from 'react';
import ng from 'core/services/ng';
import {IDesk} from 'superdesk-api';
import {
    CheckButtonGroup,
    RadioButtonGroup,
    Switch,
    Dropdown,
    NavButton,
    ButtonGroup,
    Button,
} from 'superdesk-ui-framework/react';
import {IMenuItem} from 'superdesk-ui-framework/app-typescript/components/Dropdown';
import {IMasterDeskTab, IMasterDeskViews, getLabelForMasterDeskTab, USER_PREFERENCE_SETTINGS} from '../MasterDesk';
import {gettext} from 'core/utils';

interface IProps {
    desks: Array<IDesk>;
    activeTab: string;
    selectedDesk: IDesk;
    isFilterAllowed?: boolean;
    isFilterOpened: boolean;
    isPlaningActive?: boolean;
    onTabChange(tab: IMasterDeskTab): void;
    onDeskChange(desk: IDesk): void;
    onUpdateDeskList(desks: Array<string>, showAllDesks: boolean): void;
    onFilterOpen(filter: boolean): void;
}

interface IState {
    openDeskDropdown: boolean;
    availableDesks: Array<IDesk>;
    activeDesks: Array<string>;
    showAllDesks: boolean;
}

export class HeaderComponent extends React.Component<IProps, IState> {
    services: any;
    deskDropdownItems: Array<IMenuItem> = [];

    constructor(props: IProps) {
        super(props);

        this.state = {
            openDeskDropdown: false,
            activeDesks: [],
            availableDesks: [],
            showAllDesks: true,
        };

        this.services = {
            desks: ng.get('desks'),
            preferences: ng.get('preferencesService'),
            session: ng.get('session'),
            location: ng.get('$location'),
            route: ng.get('$route'),
        };

        this.changeTab = this.changeTab.bind(this);
        this.openFilter = this.openFilter.bind(this);
    }

    componentDidMount() {
        Promise.all([
            this.services.preferences.get(USER_PREFERENCE_SETTINGS),
            this.services.desks.initialize(),
        ]).then((res) => {
            const [preferences] = res;

            this.setState({availableDesks: this.services.desks.desks._items});

            this.services.desks.desks._items.map((item) => this.deskDropdownItems.push({
                label: item.name, onSelect: () => this.props.onDeskChange(item),
            }));

            if (preferences) {
                this.setState({
                    activeDesks: preferences.items || [],
                    showAllDesks: preferences.showAllDesks === undefined ?
                        true : preferences.showAllDesks,
                });
            }
        });
    }

    changeTab(tab: IMasterDeskTab) {
        this.props.onTabChange(tab);
    }

    openFilter() {
        this.props.onFilterOpen(!this.props.isFilterOpened);
    }

    toggleDesk(desk: IDesk) {
        if (this.state.activeDesks.includes(desk._id)) {
            let index = this.state.activeDesks.indexOf(desk._id);

            this.setState({
                activeDesks: [
                    ...this.state.activeDesks.slice(0, index),
                    ...this.state.activeDesks.slice(index + 1),
                ],
                showAllDesks: false,
            }, this.saveDeskPreferences);
        } else {
            this.setState({
                activeDesks: this.state.activeDesks.concat(desk._id),
                showAllDesks: false,
            }, this.saveDeskPreferences);
        }
    }

    toggleShowAll() {
        this.setState({
            showAllDesks: !this.state.showAllDesks,
            activeDesks: [],
        }, this.saveDeskPreferences);
    }

    saveDeskPreferences() {
        let update = [];

        update[USER_PREFERENCE_SETTINGS] = {
            items: this.state.activeDesks,
            showAllDesks: this.state.showAllDesks,
        };

        this.services.preferences.update(update).then(() => {
            this.props.onUpdateDeskList(this.state.activeDesks, this.state.showAllDesks);
        });
    }

    goToDesk(desk: IDesk) {
        let currentDesk = this.services.desks.getCurrentDeskId();

        if (currentDesk !== desk._id) {
            this.services.desks.setCurrentDeskId(desk._id);
        }

        this.services.location.url('/workspace/monitoring');
        this.services.route.reload();
    }

    isDeskActive(desk: IDesk) {
        return this.state.activeDesks.includes(desk._id);
    }

    isDeskMember(desk: IDesk) {
        return desk ? !!desk.members.find((user: any) => user.user === this.services.session.identity._id) : false;
    }

    render() {
        const planningComponents = [IMasterDeskTab.assignments];

        const tabs = Object.values(IMasterDeskTab).filter((tab) =>
            this.props.isPlaningActive ? tab : !planningComponents.includes(tab),
        ).map((tab) => (
            {value: tab, label: getLabelForMasterDeskTab(tab)}
        ));

        return (
            <div className="sd-main-content-grid__header">
                <div className="subnav">
                    {this.props.selectedDesk != null ? (
                        <React.Fragment>
                            <div className="flat-searchbar">
                                <button
                                    className="navbtn navbtn--left"
                                    onClick={() => this.props.onDeskChange(null)}
                                >
                                    <i className="icon-arrow-left" />
                                </button>
                            </div>
                            <ButtonGroup align="inline">
                                <Dropdown items={this.deskDropdownItems}>
                                    <NavButton
                                        type="default"
                                        text={this.props.selectedDesk.name}
                                        onClick={() => false}
                                    />
                                </Dropdown>
                            </ButtonGroup>
                        </React.Fragment>
                    ) : null}

                    {this.props.isFilterAllowed && this.props.selectedDesk == null ? (
                        <button
                            className={'sd-navbtn sd-navbtn--left sd-navbtn--darker' +
                                (this.props.isFilterOpened ? ' sd-navbtn--active' : '')}
                            onClick={() => this.openFilter()}
                        >
                            <i className="icon-filter-large" />
                        </button>
                    ) : null}

                    <ButtonGroup align="end" padded={true}>
                        <CheckButtonGroup>
                            <RadioButtonGroup
                                value={this.props.activeTab}
                                options={tabs}
                                onChange={(value: IMasterDeskTab) => this.changeTab(value)}
                            />
                        </CheckButtonGroup>
                    </ButtonGroup>

                    {this.props.selectedDesk != null &&
                        this.isDeskMember(this.props.selectedDesk) ? (
                            <ButtonGroup align="end">
                                <Button
                                    text={gettext('Go To Desk')}
                                    style="hollow"
                                    onClick={() => this.goToDesk(this.props.selectedDesk)}
                                />
                            </ButtonGroup>
                        ) : null}

                    <div className={'dropdown' + (this.state.openDeskDropdown ? ' open' : '')}>
                        <button
                            className="sd-navbtn"
                            onClick={() =>
                                this.setState({openDeskDropdown: !this.state.openDeskDropdown})}
                        >
                            <i className="icon-switches" />
                        </button>
                        <ul className="dropdown__menu dropdown--align-right">
                            <li className="dropdown__menu-label">{gettext('Select desks')}</li>
                            <li className="dropdown__menu-item--no-link" >
                                <label>{gettext('Show all')}</label>
                                <div className="pull-right">
                                    <Switch
                                        label={{hidden: true, text: gettext('Show all')}}
                                        value={this.state.showAllDesks}
                                        onChange={() => this.toggleShowAll()}
                                    />
                                </div>
                            </li>
                            <li className="dropdown__menu-divider" />
                            {this.state.availableDesks.map((item, key) => (
                                <li className="dropdown__menu-item--no-link" key={key}>
                                    <label>{item.name}</label>
                                    <div className="pull-right">
                                        <Switch
                                            label={{hidden: true, text: gettext('Toggle desk')}}
                                            value={this.isDeskActive(item)}
                                            onChange={() => this.toggleDesk(item)}
                                        />
                                    </div>
                                </li>
                            ),
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}
