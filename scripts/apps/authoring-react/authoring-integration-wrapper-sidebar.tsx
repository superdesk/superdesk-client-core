import React from 'react';
import * as Nav from 'superdesk-ui-framework/react/components/Navigation';
import {IArticle, IArticleSideWidget, IExposedFromAuthoring} from 'superdesk-api';
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
    badges: {[widgetId: string]: string | null} | null;
}

export class AuthoringIntegrationWrapperSidebar extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            badges: null,
        };
    }

    componentDidMount(): void {
        Promise.all(
            getWidgetsFromExtensions(this.props.options.item).map((widget) => {
                if (widget.getBadge == null) {
                    return Promise.resolve({badge: null, widget});
                } else {
                    return widget.getBadge(this.props.options.item).then((badge) => ({badge, widget}));
                }
            }),
        ).then((result) => {
            const badges: IState['badges'] = {};

            for (const {widget, badge} of result) {
                badges[widget._id] = badge;
            }

            this.setState({badges});
        });
    }

    /**
     * Recomputed on every render rather than kept in state: the item is not locked yet on the
     * first one, so a widget that needs it editable would stay locked for the whole session.
     */
    getLockedWidgetIds(widgets: Array<IArticleSideWidget>): Array<string> {
        const lockState = getSideWidgetLockState(this.props.options.item, this.props.readOnly);

        return widgets
            .filter((widget) => isSideWidgetLocked(widget, lockState))
            .map((widget) => widget._id);
    }

    render() {
        if (this.state.badges == null) {
            return null;
        }

        const {sideWidget, setSideWidget} = this.props;

        // which widgets are allowed depends on the item, and switching the content profile
        // changes the answer, so the list can not be captured once
        const widgets = getWidgetsFromExtensions(this.props.options.item);
        const lockedWidgetIds = this.getLockedWidgetIds(widgets);
        const tabs: Array<ISideBarTab> = widgets.map((widget) => ({
            icon: widget.icon,
            size: 'big',
            tooltip: lockedWidgetIds.includes(widget._id)
                ? gettext('{{widget}} (not available while the item can not be edited)', {widget: widget.label})
                : widget.label,
            id: widget._id,
            badgeValue: this.state.badges[widget._id] ?? null,
            type: widget.buttonType,
        }));

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
