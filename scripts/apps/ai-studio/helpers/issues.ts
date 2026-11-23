import {gettext} from 'core/utils';
import type {IAIActionDraftErrors, IAIActionDraftField} from '../interfaces';
import {PARAMETER_FIELDS} from './draft';

/** Fields whose control can show an error; issues about any other field are toasted */
const ACTION_FIELDS: Array<IAIActionDraftField> = [
    'name',
    'content_profiles',
    'input_fields',
    'output_field',
    'provider',
    'model',
];

/** Added by the server next to the field issues, repeating the error message as text */
const IGNORED_ISSUES = ['validator exception', 'validation exception'];

export interface IMappedIssues {
    fields: IAIActionDraftErrors;

    /** Issues about something the form has no control for, worded as "key: message" */
    other: Array<string>;
}

/** A message, or messages keyed by error type (`{required: '...'}`), one level deeper for lists */
function getMessages(issue: unknown): Array<string> {
    if (typeof issue === 'string') {
        return [issue];
    }

    if (issue != null && typeof issue === 'object') {
        return Object.values(issue).flatMap(getMessages);
    }

    return [];
}

/**
 * Parameter issues come nested under `parameters` or as dotted keys, depending on server settings.
 * Issues for fields without a control go to `other`, so they are still shown.
 */
export function mapIssues(issues: unknown): IMappedIssues {
    const result: IMappedIssues = {fields: {}, other: []};

    if (issues == null || typeof issues !== 'object') {
        return result;
    }

    const add = (path: Array<string>, issue: unknown) => {
        const messages = getMessages(issue);

        if (messages.length < 1) {
            return;
        }

        const [first, second] = path;
        const field: IAIActionDraftField | undefined = first === 'parameters'
            ? PARAMETER_FIELDS.find((name) => name === second)
            : ACTION_FIELDS.find((name) => name === first);

        if (field != null) {
            result.fields[field] = [result.fields[field], ...messages].filter(Boolean).join(' ');
        } else {
            result.other.push(`${path.join('.')}: ${messages.join(' ')}`);
        }
    };

    Object.entries(issues).forEach(([key, issue]) => {
        if (IGNORED_ISSUES.includes(key)) {
            return;
        }

        const path = key.split('.');

        if (path.length === 1 && key === 'parameters' && issue != null && typeof issue === 'object') {
            Object.entries(issue).forEach(([parameter, parameterIssue]) => {
                add(['parameters', parameter], parameterIssue);
            });
        } else {
            add(path, issue);
        }
    });

    return result;
}

/** The message of an error response, for when no issue explains it */
export function getErrorMessage(body: unknown): string {
    if (body != null && typeof body === 'object') {
        const {_message, _error} = body as {_message?: unknown; _error?: {message?: unknown}};

        if (typeof _message === 'string' && _message.trim() !== '') {
            return _message;
        }

        if (typeof _error?.message === 'string' && _error.message.trim() !== '') {
            return _error.message;
        }
    }

    if (typeof body === 'string' && body.trim() !== '') {
        return body;
    }

    return gettext('The server could not complete the request.');
}
