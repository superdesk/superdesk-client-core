import React from 'react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {getWidgetsFromExtensions, ISideWidget} from './authoring-integration-wrapper';
import {closedIntentionally} from 'apps/authoring/widgets/widgets';

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

        const {sideWidget} = this.props;

        return (
            <Nav.SideBarTabs
                disabled={sideWidget?.pinned}
                activeTab={sideWidget?.id}
                onActiveTabChange={(nextWidgetId) => {
                    if (nextWidgetId == null && closedIntentionally.value == true) {
                        closedIntentionally.value = false;
                    }

                    const isWidgetPinned = (() => {
                        if (sideWidget?.id != null && sideWidget.id === nextWidgetId) {
                            return sideWidget.pinned;
                        }

                        return false;
                    })();

                    this.props.setSideWidget(
                        nextWidgetId == null
                            ? null
                            : {
                                id: nextWidgetId,
                                pinned: isWidgetPinned,
                            },
                    );
                }}
                items={this.state.sidebarTabs}
            />
        );
    }
}