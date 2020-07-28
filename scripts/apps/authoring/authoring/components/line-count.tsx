import React from 'react';
import {stripHtmlTags, gettextPlural} from 'core/utils';
import {appConfig} from 'appConfig';

interface IProps {
    html: string;
}

/**
 * Count lines in given html.
 */
export class LineCount extends React.PureComponent<IProps> {
    render() {
        const lines = getLinesCount(stripHtmlTags(this.props.html));

        if (lines == null) {
            return null;
        }

        return <span className="char-count lines">{lines + ' ' + gettextPlural(lines, 'line', 'lines')}</span>;
    }
}

export function getLinesCount(plainText): number | null {
    const lineLength = appConfig?.authoring?.lineLength;

    if (lineLength == null) {
        return null;
    }

    return plainText.split('\n').reduce((sum, line) => sum + Math.ceil(line.length / lineLength), 0);
}
