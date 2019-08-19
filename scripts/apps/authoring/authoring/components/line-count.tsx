import React from 'react';
import {get} from 'lodash';
import {stripHtmlTags, gettextPlural} from 'core/utils';
import {appConfig} from 'core/config';

interface IProps {
    html: string;
}

/**
 * Count lines in given html.
 */
export class LineCount extends React.PureComponent<IProps> {
    render() {
        const lineLength: number = get(appConfig, 'authoring.lineLength', 0);

        if (lineLength <= 0) {
            return null;
        }

        const text = stripHtmlTags(this.props.html);
        const lines = text.split('\n').reduce((sum, line) => sum + Math.ceil(line.length / lineLength), 0);

        return <span className="char-count lines">{lines + ' ' + gettextPlural(lines, 'line', 'lines')}</span>;
    }
}
