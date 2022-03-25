import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';
import {IDropdownConfigRemoteSource, IDropdownValue} from '..';

type IProps = IDifferenceComponentProps<IDropdownValue, IDropdownConfigRemoteSource>;

export class DifferenceRemoteSource extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;

        const values1 =
            (Array.isArray(value1) ? value1 : [value1])
                .map((val) => config.getLabel(val))
                .join(',');

        const values2 =
            (Array.isArray(value2) ? value2 : [value2])
                .map((val) => config.getLabel(val))
                .join(',');

        return (
            <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(values1, values2)}} />
        );
    }
}
