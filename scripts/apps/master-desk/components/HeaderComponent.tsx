import React from 'react';
import {IDesk} from 'superdesk-api';

import {CheckButtonGroup, RadioButton, Switch} from 'superdesk-ui-framework/react';
import {IMasterDeskTab, getLabelForMasterDeskTab, USER_PREFERENCE_SETTINGS} from '../MasterDesk';
import {gettext} from 'core/utils';

interface IProps {
    desks: Array<IDesk>;
    activeTab?: string;
    preferencesService?: any;
    deskService?: any;
    isFilterAllowed?: boolean;
    isPlaningActive?: boolean;
    onTabChange(tab: IMasterDeskTab): void;
    onUpdateDeskList(desks: Array<string>): void;
    onFilterOpen(filter: boolean): void;
}

interface IState {
    currentTab: IMasterDeskTab;
    openFilter: boolean;
    openDeskDropdown: boolean;
    availableDesks: Array<IDesk>;
    activeDesks: Array<string>;
}

export class HeaderComponent extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            currentTab: IMasterDeskTab.overview,
            openFilter: false,
            openDeskDropdown: false,
            activeDesks: [],
            availableDesks: [],
        };

        this.changeTab.bind(this);
        this.openFilter.bind(this);

        this.props.deskService.initialize().then(() => {
            this.setState({availableDesks: this.props.deskService.desks._items});
        });

        this.props.preferencesService.get(USER_PREFERENCE_SETTINGS).then((desks) => {
            if (!desks) {
                return;
            }

            this.setState({activeDesks: desks.items});
        });
    }

    changeTab(tab: IMasterDeskTab) {
        this.setState({currentTab: tab});
        this.props.onTabChange(tab);
    }

    openFilter() {
        this.setState({openFilter: !this.state.openFilter});
        this.props.onFilterOpen(!this.state.openFilter);
    }

    toggleDesk(desk: IDesk) {
        let update = [], desks = this.state.activeDesks;

        this.state.activeDesks.includes(desk._id) ?
            desks.splice(desks.indexOf(desk._id), 1) :
            desks.push(desk._id);

        update[USER_PREFERENCE_SETTINGS] = {items: desks};

        this.props.preferencesService.update(update).then((result) => {
            this.setState({activeDesks: desks});
            this.props.onUpdateDeskList(desks);
        });
    }

    isDeskActive(desk: IDesk) {
        return this.state.activeDesks.includes(desk._id);
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
                    {this.props.isFilterAllowed ? (
                        <button
                            className={'sd-navbtn sd-navbtn--left sd-navbtn--darker' +
                                (this.state.openFilter ? ' sd-navbtn--active' : '')}
                            onClick={() => this.openFilter()}
                        >
                            <i className="icon-filter-large" />
                        </button>
                    ) : null}

                    <div className="button-group button-group--left button-group--padded">
                        <CheckButtonGroup>
                            <RadioButton
                                value={this.state.currentTab}
                                options={tabs}
                                onChange={(value: IMasterDeskTab) => this.changeTab(value)}
                            />
                        </CheckButtonGroup>
                    </div>
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
                            {this.state.availableDesks.map((item, key) => (
                                <div className="dropdown__menu-item--no-link" key={key}>
                                    <label>{item.name}</label>
                                    <div className="pull-right">
                                        <Switch
                                            value={this.isDeskActive(item)}
                                            onChange={() => this.toggleDesk(item)}
                                        />
                                    </div>
                                </div>
                            ),
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}
