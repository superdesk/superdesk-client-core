import type {ComponentProps} from 'react';
import type {SvgIconIllustration} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import type {IAIActionType, IAIUserAction} from '../interfaces';

/** A readable fallback for a value the client has no label for yet, such as a new action type */
function humanize(value: string): string {
    const text = value.replace(/_/g, ' ');

    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getActionTypeLabel(actionType: IAIActionType | string): string {
    switch (actionType) {
        case 'suggestion':
            return gettext('Suggestion');
        case 'summary':
            return gettext('Summary');
        case 'rewrite':
            return gettext('Rewrite');
        case 'translation':
            return gettext('Translation');
        default:
            return humanize(actionType);
    }
}

type IIllustration = ComponentProps<typeof SvgIconIllustration>['illustration'];

/** The same illustrations the AI widget in the editor shows for these action types */
export function getActionTypeIllustration(actionType: IAIActionType | string): IIllustration {
    switch (actionType) {
        case 'suggestion':
            return 'headlines';
        case 'summary':
            return 'summary';
        case 'translation':
            return 'translate';
        default:
            return 'optimise';
    }
}

/** Plural, for the type filter */
export function getActionTypeFilterLabel(actionType: IAIActionType | string): string {
    switch (actionType) {
        case 'suggestion':
            return gettext('Suggestions');
        case 'summary':
            return gettext('Summaries');
        case 'rewrite':
            return gettext('Rewrites');
        case 'translation':
            return gettext('Translations');
        default:
            return humanize(actionType);
    }
}

export function getUserActionLabel(userAction: IAIUserAction | string): string {
    switch (userAction) {
        case 'apply':
            return gettext('Apply');
        case 'copy':
            return gettext('Copy');
        default:
            return humanize(userAction);
    }
}
