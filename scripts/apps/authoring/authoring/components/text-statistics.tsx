import * as React from 'react';
import {CharacterCount2} from 'apps/authoring/authoring/components/CharacterCount';
import {gettextPlural} from 'core/utils';
import {countWords} from 'core/count-words';
import {getReadingTimeText} from 'apps/authoring/authoring/directives/ReadingTime';
import {Spacer} from 'core/ui/components/Spacer';

interface IProps {
    text: string;
    language?: string;
    limit?: number;
}

export class TextStatistics extends React.PureComponent<IProps> {
    render() {
        const wordCount = countWords(this.props.text);
        const readingTime: string = getReadingTimeText(this.props.text, this.props.language);

        return (
            <Spacer h gap="8" noWrap>
                <span className="char-count-base">
                    {gettextPlural(wordCount, 'one word', '{{x}} words', {x: wordCount})}
                </span>

                <CharacterCount2
                    limit={this.props.limit}
                    html={false}
                    item={this.props.text}
                />

                <span className="char-count-base">{readingTime}</span>
            </Spacer>
        );
    }
}
