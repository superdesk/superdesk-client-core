import React from 'react';
import {stripHtmlTags, gettextPlural} from 'core/utils';
import {appConfig} from 'appConfig';
import {configurableAlgorithms} from 'core/ui/configurable-algorithms';

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

function countLinesDefault(plainText: string, lineLength: number): number {
    return plainText.split('\n').reduce((sum, line) => sum + Math.ceil(line.length / lineLength), 0);
}

export function getLinesCount(plainText: string): number | null {
    const lineLength = appConfig?.authoring?.lineLength;

    if (lineLength == null) {
        return null;
    }

    const fn = configurableAlgorithms.countLines ?? countLinesDefault;

    return fn(plainText, lineLength);
}
