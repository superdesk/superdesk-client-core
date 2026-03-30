import * as React from 'react';
import {gettextPlural} from 'core/utils';
import {countWords} from 'core/count-words';
import {getReadingTimeText} from 'apps/authoring/authoring/directives/ReadingTime';
import {Spacer} from 'core/ui/components/Spacer';
import {appConfig} from 'appConfig';
import {LineCount} from './line-count';
import {CharacterCount2} from './CharacterCount';

interface IProps {
    text: string;
    language?: string;
    limit?: number;
    singleLine?: boolean;
}

export class TextStatistics extends React.PureComponent<IProps> {
    render() {
        const wordCount = countWords(this.props.text);
        const showLineCount = appConfig?.authoring?.lineLength != null && !this.props.singleLine;
        const showReadingTime = appConfig?.authoring?.timeToRead !== false;
        const readingTime = showReadingTime
            ? getReadingTimeText(this.props.text, this.props.language)
            : null;

        return (
            <Spacer h gap="8" noWrap>
                {showLineCount ? <LineCount text={this.props.text} /> : null}

                <span className="char-count-base">
                    {gettextPlural(wordCount, 'one word', '{{x}} words', {x: wordCount})}
                </span>

                <CharacterCount2
                    limit={this.props.limit}
                    html={false}
                    item={this.props.text}
                />

                {readingTime != null ? <span className="char-count-base">{readingTime}</span> : null}
            </Spacer>
        );
    }
}
