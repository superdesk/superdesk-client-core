import React from 'react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';

interface IProps {
    item: string;
    field: string;
    onChange: (field: string, isError: boolean) => void;
}

export class ValidateCharacters extends React.PureComponent<IProps> {
    render() {
        const {item, field, onChange} = this.props;
        const config = ng.get('$rootScope').config;
        let invalidCharError = null;

        if (item == null || field == null) {
            return null;
        }

        if (config != null && config.disallowedCharacters != null) {
            const disallowedCharacters = config.disallowedCharacters.split('');
            const invalidCharString = disallowedCharacters.filter((char) => item.includes(char)).join(', ');

            if (invalidCharString.length > 0) {
                onChange(field, true);
                invalidCharError = gettext(
                    'Character {{chars}} not allowed in the {{field}}.',
                    {chars: invalidCharString, field: field},
                );
            } else {
                onChange(field, false);
            }
        }

        return invalidCharError != null ? <span>{invalidCharError}</span> : null;
    }
}
