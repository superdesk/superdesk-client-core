import React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IUrlsFieldConfig, IUrlsFieldValueOperational} from './interfaces';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';

type IProps = IDifferenceComponentProps<IUrlsFieldValueOperational, IUrlsFieldConfig>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const value1Sorted = (this.props.value1 ?? []).sort((a, b) => a.url.localeCompare(b.url));
        const value2Sorted = (this.props.value2 ?? []).sort((a, b) => a.url.localeCompare(b.url));

        const value1HtmlString =
            value1Sorted
                .map(({url, description}) => `${url}<br />${description}`)
                .join('<br /><br />');

        const value2HtmlString =
            value2Sorted
                .map(({url, description}) => `${url}<br />${description}`)
                .join('<br /><br />');

        return (
            <div>
                <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(value1HtmlString, value2HtmlString)}} />
            </div>
        );
    }
}
