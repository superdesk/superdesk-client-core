import * as React from 'react';
import {IDropdownConfigRemoteSource} from 'superdesk-api';

export function getValueTemplate(config: IDropdownConfigRemoteSource): React.ComponentType<{item: unknown}> {
    function defaultTemplate({item}) {
        return (
            <span>{config.getLabel(item)}</span>
        );
    }

    return config.valueTemplate ?? config.optionTemplate ?? defaultTemplate;
}
