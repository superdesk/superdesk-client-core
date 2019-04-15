import React from 'react';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {capitalize} from 'lodash';
import {coreMenuGroups} from 'core/activity/activity';
import {gettext} from 'core/utils';

interface IProps {
    $route: any;
    superdesk: any;
    pageTitle: any;
}

interface IState {
    loading: boolean;
    flatMenuItems: Array<any>;
}

class SettingsComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            flatMenuItems: [],
        };
    }

    componentDidMount() {
        const {$route, pageTitle, superdesk} = this.props;
        const currentRoute = $route.current;

        pageTitle.setUrl(capitalize(gettext('Settings')));
        if (currentRoute.$$route.label !== 'Settings') {
            pageTitle.setWorkspace(capitalize(gettext(currentRoute.$$route.label)));
        } else {
            pageTitle.setWorkspace(null);
        }

        superdesk.getMenu(superdesk.MENU_SETTINGS).then((flatMenuItems) => {
            this.setState({
                flatMenuItems: flatMenuItems.sort((a, b) =>
                    b.settings_menu_group.priority - a.settings_menu_group.priority),
                loading: false,
            });
        });
    }
    render() {
        if (this.state.loading) {
            return null;
        }

        const menuItemsByGroup = this.state.flatMenuItems.reduce((accumulator, item) => {
            if (item.hasOwnProperty('settings_menu_group') === false) {
                throw new Error('Settings items must have a group');
            }
            if (Array.isArray(accumulator[item.settings_menu_group.id]) !== true) {
                accumulator[item.settings_menu_group.id] = [];
            }
            accumulator[item.settings_menu_group.id].push(item);

            return accumulator;
        }, {});

        const listToRender = [];
        const blockToRender = [];
        let reactKey = 0;

        const currentRoute = this.props.$route.current;

        for (const key in menuItemsByGroup) {
            menuItemsByGroup[key] = menuItemsByGroup[key].sort((a, b) => {
                let textA = a.label.toLowerCase();
                let textB = b.label.toLowerCase();
                // to sort alphabetically

                if (textA < textB) {
                    return -1;
                }
                if (textA > textB) {
                    return 1;
                }
                return 0;
            });

            const groupLabel = coreMenuGroups[key].getLabel();

            listToRender.push(
                <li key={++reactKey} className="sd-left-nav__group-header">{groupLabel}</li>,
            );

            let blockGroupHeading = (
                <div key={++reactKey}
                    className="sd-card__header sd-card__header--with-thumb sd-card__header--gradient-1">
                    <div className="sd-card__thumbnail sd-card__thumbnail--size-s">
                        <h4 className="sd-card__thumbnail-heading">{groupLabel}</h4>
                    </div>
                </div>
            );

            let blockListItems = [];

            menuItemsByGroup[key].forEach((item) => {
                const className = 'sd-left-nav__btn'
                    + (currentRoute._id === item._id ? ' sd-left-nav__btn--active' : '');

                listToRender.push(
                    (
                        <li key={++reactKey}>
                            <a href={'#' + item.href} className={className}>
                                {gettext(item.label)}
                            </a>
                        </li>
                    ),
                );

                blockListItems.push(<a key={++reactKey}
                    href={'#' + item.href} className="text-link">{gettext(item.label)}</a>);
            });

            blockToRender.push(<div className="sd-card" key={++reactKey}>
                {blockGroupHeading}
                <div className="sd-card__content sd-padding-all--3">
                    <div className="text-link__group">
                        {blockListItems}
                    </div>
                </div>
            </div>);
        }

        const defaultSettingsPage = (
            <div className="sd-page__content sd-page__content--centered-dashboard">
                <div className="sd-grid-list sd-grid-list--auto-fit">{blockToRender}</div>
            </div>
        );

        return (
            <div className="sd-page">
                <nav className="sd-page__sidebar sd-left-nav">
                    <ul>{listToRender}</ul>
                </nav>
                <section className="sd-page__main-content">
                    {currentRoute.$$route.label === 'Settings' ? defaultSettingsPage : this.props.children}
                </section>
            </div>
        );
    }
}

export const Settings = connectServices(SettingsComponent, ['$route', 'superdesk', 'pageTitle']);
