import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';

export class Difference extends React.PureComponent<IDifferenceComponentProps<IDropdownValue, IDropdownConfig>> {
    render() {
        const {value1, value2, config} = this.props;
        const option1 = config.options.find((_option) => _option.id === value1);
        const option2 = config.options.find((_option) => _option.id === value2);

        return (
            <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(option1.label, option2.label)}} />
        );
    }
}
