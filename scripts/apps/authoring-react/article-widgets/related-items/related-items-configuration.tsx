import React from 'react';
import {Option, Select} from 'superdesk-ui-framework/react';
import {ISideWidgetConfigurationProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {IModificationDateAfter, IRelatedItemsConfiguration, ISluglineMatch} from './related-items-logic';

export class RelatedItemsConfiguration
    extends React.PureComponent<ISideWidgetConfigurationProps<IRelatedItemsConfiguration>> {
    render(): JSX.Element {
        const {configuration, onChange} = this.props;

        return (
            <Spacer v gap="16" noWrap alignItems="stretch">
                <Select
                    label={gettext('Slugline Match')}
                    value={configuration.sluglineMatch}
                    onChange={(value: ISluglineMatch) => {
                        onChange({...configuration, sluglineMatch: value});
                    }}
                    data-test-id="related-items-slugline-match"
                >
                    <Option value="EXACT">{gettext('Exact')}</Option>
                    <Option value="ANY">{gettext('Match Any')}</Option>
                    <Option value="PREFIX">{gettext('Match Prefix')}</Option>
                </Select>

                <Select
                    label={gettext('Last Updated')}
                    value={configuration.modificationDateAfter}
                    onChange={(value: IModificationDateAfter) => {
                        onChange({...configuration, modificationDateAfter: value});
                    }}
                    data-test-id="related-items-last-updated"
                >
                    <Option value="now-6h">{gettext('6 Hours')}</Option>
                    <Option value="now-12h">{gettext('12 Hours')}</Option>
                    <Option value="today">{gettext('Today')}</Option>
                    <Option value="now-24h">{gettext('24 Hours')}</Option>
                    <Option value="now-48h">{gettext('48 Hours')}</Option>
                </Select>
            </Spacer>
        );
    }
}
