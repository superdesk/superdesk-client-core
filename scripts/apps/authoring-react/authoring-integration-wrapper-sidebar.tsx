import React from 'react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {getWidgetsFromExtensions, ISideWidget} from './authoring-integration-wrapper';

interface IProps {
    options: IExposedFromAuthoring<IArticle>;
    sideWidget: ISideWidget | null;
    setSideWidget(sideWidget: ISideWidget | null): void;
}

interface IState {
    sidebarTabs: Array<ISideBarTab> | null;
}

export class AuthoringIntegrationWrapperSidebar extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            sidebarTabs: null,
        };
    }

    componentDidMount(): void {
        const widgetsFromExtensions = getWidgetsFromExtensions(this.props.options.item);

        Promise.all(
            widgetsFromExtensions.map((widget) => {
                if (widget.getBadge == null) {
                    return Promise.resolve({badge: null, widget});
                } else {
                    return widget.getBadge(this.props.options.item).then((badge) => ({badge, widget}));
                }
            }),
        ).then((result) => {
            const sidebarTabs: Array<ISideBarTab> = result
                .map(({widget, badge}) => {
                    const tab: ISideBarTab = {
                        icon: widget.icon,
                        size: 'big',
                        tooltip: widget.label,
                        id: widget._id,
                        badgeValue: badge,
                    };

                    return tab;
                });

            this.setState({sidebarTabs: sidebarTabs});
        });
    }

    render() {
        if (this.state.sidebarTabs == null) {
            return null;
        }

        const {sideWidget, setSideWidget} = this.props;

        return (
            <Nav.SideBarTabs
                activeTab={sideWidget?.activeId}
                onActiveTabChange={(nextWidgetId) => {
                    // active is closed, we set the pinned as active
                    if (nextWidgetId == null && sideWidget.pinnedId != null) {
                        setSideWidget({
                            activeId: sideWidget?.pinnedId,
                            pinnedId: sideWidget?.pinnedId,
                        });
                    } else {
                        setSideWidget({
                            activeId: nextWidgetId,
                            pinnedId: sideWidget?.pinnedId,
                        });
                    }
                }}
                items={this.state.sidebarTabs}
            />
        );
    }
}
