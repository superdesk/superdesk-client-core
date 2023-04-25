import React from 'react';
import {
    IArticleSideWidget,
    IExtensionActivationResult,
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

const WIDGET_ID = 'versions-and-item-history';

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    selectedTab: 'versions' | 'history';
}

class VersionsAndItemHistoryWidget extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedTab: 'versions',
        };
    }

    render() {
        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={WIDGET_ID}
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
                                selected={this.state.selectedTab}
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
        _id: WIDGET_ID,
        label: getLabel(),
        order: 4,
        icon: 'history',
        component: VersionsAndItemHistoryWidget,
    };

    return widget;
}
