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
    hideReadingTime?: boolean;
}

export class TextStatistics extends React.PureComponent<IProps> {
    render() {
        const wordCount = countWords(this.props.text);

        return (
            <div className="char-count__wrapper">
                <span className="char-count__base">
                    {gettextPlural(wordCount, 'one word', '{{x}} words', {x: wordCount})}
                </span>

                <CharacterCount2
                    limit={this.props.limit}
                    html={false}
                    item={this.props.text}
                />

                {this.props.hideReadingTime !== true && (
                    <span className="char-count__base">
                        {getReadingTimeText(this.props.text, this.props.language)}
                    </span>
                )}
            </div>
        );
    }
}
