import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IDropdownValue, IDropdownConfig} from '.';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';
import {getOptions} from './get-options';

export class Difference extends React.PureComponent<IDifferenceComponentProps<IDropdownValue, IDropdownConfig>> {
    render() {
        const {value1, value2, config} = this.props;
        const options = getOptions(config);
        const option1 = options.find((_option) => _option.id === value1);
        const option2 = options.find((_option) => _option.id === value2);

        return (
            <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(option1.label, option2.label)}} />
        );
    }
}
