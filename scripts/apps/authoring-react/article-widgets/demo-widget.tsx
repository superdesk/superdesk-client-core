import React from 'react';
import {IArticleSideWidget, IArticleSideWidgetComponentType} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework';
import {sdApi} from 'api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Demo widget');

class DemoWidget extends React.PureComponent<IArticleSideWidgetComponentType> {
    render() {
        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <div>
                        <Button
                            text={gettext('Alter slugline')}
                            onClick={() => {
                                sdApi.article.patch(
                                    this.props.article,
                                    {slugline: (this.props.article.slugline ?? '') + '@'},
                                );
                            }}
                            size="small"
                        />
                    </div>
                )}
                footer={(
                    <div>test footer</div>
                )}
            />
        );
    }
}

export function getDemoWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'demo-widget',
        label: getLabel(),
        order: 2,
        icon: 'info',
        component: DemoWidget,
    };

    return metadataWidget;
}
