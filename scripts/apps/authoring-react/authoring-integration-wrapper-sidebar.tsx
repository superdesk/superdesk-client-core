import React from 'react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {IArticle, IExposedFromAuthoring} from 'superdesk-api';
import {ISideBarTab} from 'superdesk-ui-framework/react/components/Navigation/SideBarTabs';
import {gettext} from 'core/utils';
import {ISideWidget} from './authoring-integration-wrapper';
import {getSideWidgetLockState, getWidgetsFromExtensions, isSideWidgetLocked} from './side-widgets';

interface IProps {
    options: IExposedFromAuthoring<IArticle>;
    sideWidget: ISideWidget | null;
    readOnly: boolean;
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
                        type: widget.buttonType,
                    };

                    return tab;
                });

            this.setState({sidebarTabs: sidebarTabs});
        });
    }

    /**
     * Recomputed on every render rather than kept in state: the item is not locked yet on the
     * first one, so a widget that needs it editable would stay locked for the whole session.
     */
    getLockedWidgetIds(): Array<string> {
        const lockState = getSideWidgetLockState(this.props.options.item, this.props.readOnly);

        return getWidgetsFromExtensions(this.props.options.item)
            .filter((widget) => isSideWidgetLocked(widget, lockState))
            .map((widget) => widget._id);
    }

    render() {
        if (this.state.sidebarTabs == null) {
            return null;
        }

        const {sideWidget, setSideWidget} = this.props;
        const lockedWidgetIds = this.getLockedWidgetIds();
        const tabs = this.state.sidebarTabs.map((tab) => lockedWidgetIds.includes(tab.id)
            ? {
                ...tab,
                tooltip: gettext(
                    '{{widget}} (not available while the item can not be edited)',
                    {widget: tab.tooltip},
                ),
            }
            : tab,
        );

        return (
            <Nav.SideBarTabs
                activeTab={sideWidget?.activeId}
                onActiveTabChange={(nextWidgetId) => {
                    if (nextWidgetId != null && lockedWidgetIds.includes(nextWidgetId)) {
                        return;
                    }

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

                items={tabs}
            />
        );
    }
}
