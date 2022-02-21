import React from 'react';
import {IAuthoringSideWidget, IArticle, IExtensionActivationResult} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework';
import {sdApi} from 'api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Demo widget');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

class DemoWidget extends React.PureComponent<IProps> {
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
    const metadataWidget: IAuthoringSideWidget = {
        _id: 'demo-widget',
        label: getLabel(),
        order: 2,
        icon: 'info',
        component: DemoWidget,
    };

    return metadataWidget;
}
