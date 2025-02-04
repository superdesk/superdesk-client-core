import React from 'react';
import {
    IArticleSideWidget,
    IArticleSideWidgetComponentType,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {assertNever} from 'core/helpers/typescript-helpers';
import {TabList} from 'core/ui/components/tabs';
import {HistoryTab} from './history-tab';
import {VersionsTab} from './versions-tab';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Versions and item history');

interface IState {
    selectedTab: 'versions' | 'history';
}
const VERSIONS_AND_HISTORY_WIDGET_ID = 'versions-and-item-history';

class VersionsAndItemHistoryWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = this.props.initialState ?? {selectedTab: 'versions'};
    }

    render() {
        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={VERSIONS_AND_HISTORY_WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                        customContent={(
                            <TabList
                                tabs={[
                                    {id: 'versions', label: gettext('Versions')},
                                    {id: 'history', label: gettext('Item history')},
                                ]}
                                onChange={(selectedTab: IState['selectedTab']) => {
                                    this.setState({selectedTab});
                                }}
                                selectedTabId={this.state.selectedTab}
                            />
                        )}
                    />
                )}
                body={(() => {
                    if (this.state.selectedTab === 'history') {
                        return (
                            <HistoryTab {...this.props} />
                        );
                    } else if (this.state.selectedTab === 'versions') {
                        return (
                            <VersionsTab {...this.props} />
                        );
                    } else {
                        assertNever(this.state.selectedTab);
                    }
                })()}
                background="grey"
            />
        );
    }
}

export function getVersionsAndItemHistoryWidget() {
    const widget: IArticleSideWidget = {
        _id: VERSIONS_AND_HISTORY_WIDGET_ID,
        label: getLabel(),
        order: 4,
        icon: 'history',
        component: VersionsAndItemHistoryWidget,
    };

    return widget;
}
