import React from 'react';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {capitalize} from 'lodash';
import {coreMenuGroups} from 'core/activity/activity';

interface IProps {
    $route: any;
    superdesk: any;
    pageTitle: any;
    gettext: any;
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

            listToRender.push(
                <li key={++reactKey} className="sd-left-nav__group-header">{coreMenuGroups[key].getLabel(gettext)}</li>,
            );

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
            });
        }

        return (
            <div className="sd-page">
                <nav className="sd-page__sidebar sd-left-nav">
                    <ul>{listToRender}</ul>
                </nav>
                <section className="sd-page__main-content">{this.props.children}</section>
            </div>
        );
    }
}

export const Settings = connectServices(SettingsComponent, ['$route', 'superdesk', 'pageTitle', 'gettext']);
