import * as React from 'react';
import {IDifferenceComponentProps} from 'superdesk-api';
import {IEditor3ValueOperational, IEditor3Config} from './interfaces';
import {editor3StateToHtml} from 'core/editor3/html/to-html/editor3StateToHtml';
import {generateHtmlDiff} from 'apps/authoring-react/generate-html-diff';

type IProps = IDifferenceComponentProps<IEditor3ValueOperational, IEditor3Config>;

export class Difference extends React.PureComponent<IProps> {
    render() {
        const {value1, value2, config} = this.props;

        const str1 = (() => {
            if (value1 == null) {
                return '';
            }

            const contentState = value1.contentState;

            if (config.singleLine) {
                return contentState.getPlainText();
            } else {
                return editor3StateToHtml(contentState);
            }
        })();

        const str2 = (() => {
            if (value2 == null) {
                return '';
            }

            const contentState = value2.contentState;

            if (config.singleLine) {
                return contentState.getPlainText();
            } else {
                return editor3StateToHtml(contentState);
            }
        })();

        return (
            <div dangerouslySetInnerHTML={{__html: generateHtmlDiff(str1, str2)}} />
        );
    }
}
