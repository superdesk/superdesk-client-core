import type {ComponentProps} from 'react';
import type {SvgIconIllustration} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import type {IAIActionType, IAIUserAction} from '../interfaces';

/** A readable fallback for a value the client has no label for yet, such as a new action type */
function humanize(value: string): string {
    const text = value.replace(/_/g, ' ');

    return text.charAt(0).toUpperCase() + text.slice(1);
}

type IIllustration = ComponentProps<typeof SvgIconIllustration>['illustration'];

interface IActionTypeInfo {
    label: string;

    /** For the type filter */
    pluralLabel: string;

    /** The same illustration the AI widget in the editor shows for the type */
    illustration: IIllustration;
}

function getActionTypeInfo(actionType: IAIActionType | string): IActionTypeInfo {
    switch (actionType) {
        case 'suggestion':
            return {label: gettext('Suggestion'), pluralLabel: gettext('Suggestions'), illustration: 'headlines'};
        case 'summary':
            return {label: gettext('Summary'), pluralLabel: gettext('Summaries'), illustration: 'summary'};
        case 'rewrite':
            return {label: gettext('Rewrite'), pluralLabel: gettext('Rewrites'), illustration: 'optimise'};
        case 'translation':
            return {label: gettext('Translation'), pluralLabel: gettext('Translations'), illustration: 'translate'};
        default:
            return {label: humanize(actionType), pluralLabel: humanize(actionType), illustration: 'optimise'};
    }
}

export function getActionTypeLabel(actionType: IAIActionType | string): string {
    return getActionTypeInfo(actionType).label;
}

export function getActionTypeFilterLabel(actionType: IAIActionType | string): string {
    return getActionTypeInfo(actionType).pluralLabel;
}

export function getActionTypeIllustration(actionType: IAIActionType | string): IIllustration {
    return getActionTypeInfo(actionType).illustration;
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
