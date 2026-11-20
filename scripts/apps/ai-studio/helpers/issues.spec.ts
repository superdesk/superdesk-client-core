import {getErrorMessage, mapIssues} from './issues';

describe('ai studio: error issues', () => {
    it('maps field issues, whether a message or messages keyed by error type', () => {
        expect(mapIssues({
            name: 'empty values not allowed',
            output_field: {text_field: 'Not a built-in or custom text field: byline'},
            input_fields: 'Value is too short',
        })).toEqual({
            fields: {
                name: 'empty values not allowed',
                output_field: 'Not a built-in or custom text field: byline',
                input_fields: 'Value is too short',
            },
            other: [],
        });
    });

    it('maps parameter issues nested under `parameters`', () => {
        expect(mapIssues({
            parameters: {
                suggestions_count: {maxlength: 'Too long'},
                extra_instructions: {maxlength: 'At most 2000 characters'},
            },
        }).fields).toEqual({
            suggestions_count: 'Too long',
            extra_instructions: 'At most 2000 characters',
        });
    });

    it('maps parameter issues sent as dotted keys', () => {
        expect(mapIssues({'parameters.max_characters': {int_parsing: 'Not a number'}}).fields).toEqual({
            max_characters: 'Not a number',
        });
    });

    it('maps an issue about one entry of a list onto the list field', () => {
        expect(mapIssues({input_fields: {0: {string_type: 'Input should be a valid string'}}}).fields).toEqual({
            input_fields: 'Input should be a valid string',
        });
    });

    it('ignores the error text the server repeats next to the issues', () => {
        expect(mapIssues({'validator exception': '400: Invalid AI action'})).toEqual({fields: {}, other: []});
    });

    it('keeps issues the form has no field for, so they can be shown', () => {
        expect(mapIssues({
            parameters: {temperature: {less_than_equal: 'Input should be less than or equal to 2'}},
            action_type: 'Input should be suggestion or summary',
        })).toEqual({
            fields: {},
            other: [
                'parameters.temperature: Input should be less than or equal to 2',
                'action_type: Input should be suggestion or summary',
            ],
        });
    });

    it('returns nothing for a response without issues', () => {
        expect(mapIssues(undefined)).toEqual({fields: {}, other: []});
    });

    it('takes the message of an error response from `_message`, then `_error.message`', () => {
        expect(getErrorMessage({_message: 'Not on the shortlist', _error: {message: 'Update failure'}}))
            .toBe('Not on the shortlist');
        expect(getErrorMessage({_error: {code: 400, message: 'Update failure'}})).toBe('Update failure');
        expect(getErrorMessage(null).length).toBeGreaterThan(0);
    });
});
