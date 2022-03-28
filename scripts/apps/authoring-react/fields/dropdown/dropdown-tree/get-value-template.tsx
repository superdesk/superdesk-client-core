import * as React from 'react';
import {IDropdownTreeConfig} from '..';

export function getValueTemplate(config: IDropdownTreeConfig): React.ComponentType<{item: unknown}> {
    function defaultTemplate({item}) {
        return (
            <span>{config.getLabel(item)}</span>
        );
    }

    return config.valueTemplate ?? config.optionTemplate ?? defaultTemplate;
}
