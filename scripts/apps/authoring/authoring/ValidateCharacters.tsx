import React from 'react';
import {gettextPlural} from 'core/utils';
import {appConfig} from 'appConfig';

interface IProps {
    item: string;
    field: string;
}

export class ValidateCharacters extends React.PureComponent<IProps> {
    render() {
        const {item, field} = this.props;
        let invalidCharError = null;

        if (item == null || field == null) {
            return null;
        }

        if (appConfig?.disallowed_characters != null) {
            const invalidCharString = appConfig.disallowed_characters.filter((char) => item.includes(char)).join(', ');

            if (invalidCharString.length > 0) {
                invalidCharError = gettextPlural(
                    invalidCharString.length,
                    'Character {{chars}} not allowed in the {{field}}.',
                    'Characters {{chars}} not allowed in the {{field}}.',
                    {chars: invalidCharString, field: field},
                );
            }
        }

        return invalidCharError != null ? <span>{invalidCharError}</span> : null;
    }
}
