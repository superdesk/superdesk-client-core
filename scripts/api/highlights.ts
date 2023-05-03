import {httpRequestJsonLocal} from 'core/helpers/network';
import {IArticle, IHighlightResponse} from 'superdesk-api';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import {ui} from 'core/ui-utils';

function markItem(highlightIds: Array<string>, itemId: string): Promise<any> {
    return httpRequestJsonLocal({
        payload: {
            highlights: highlightIds,
            marked_item: itemId,
        },
        method: 'POST',
        path: '/marked_for_highlights',
    });
}

function fetchHighlights(): Promise<IHighlightResponse> {
    return httpRequestJsonLocal<IHighlightResponse>({
        method: 'GET',
        path: '/highlights',
    });
}

function exportHighlight(id: IArticle['_id'], hasUnsavedChanges: boolean): Promise<void> {
    const request = () => {
        return httpRequestJsonLocal<void>({
            method: 'POST',
            path: '/generate_highlights',
            payload: {package: id},
        })
            .then(ng.get('authoringWorkspace').edit)
            .then(() => notify.success('Export successful.'))
            .catch((response) => {
                if (response.internal_error === 403) {
                    forceExportHighlight(id);
                } else {
                    notify.error(gettext('Error creating highlight.'));
                }
            });
    };

    return hasUnsavedChanges ? ui.confirm(gettext('You have unsaved changes, do you want to continue?'))
        .then(() => request()) : request();
}

function forceExportHighlight(id: IArticle['_id']): void {
    ui.confirm(gettext('There are items locked or not published. Do you want to continue?'))
        .then(() => {
            httpRequestJsonLocal({
                method: 'POST',
                path: '/generate_highlights',
                payload: {package: id, export: true},
            }).then(ng.get('authoringWorkspace').edit, () => {
                notify.error(gettext('Error creating highlight.'));
            });
        });
}

function prepareHighlightForPreview(id: IArticle['_id']): Promise<string> {
    return httpRequestJsonLocal({
        method: 'POST',
        path: '/generate_highlights',
        payload: {
            package: id,
            preview: true,
        },
    }).then((response: any) => {
        return response.body_html;
    }).catch((data: any) => {
        return data.message;
    });
}

function showHighlightExportButton(item: IArticle): boolean {
    return item.highlight != null && item.type === 'composite';
}

interface IHighlightsApi {
    markItem(highlighIds: Array<string>, itemId: string): Promise<any>;
    fetchHighlights(): Promise<IHighlightResponse>;
    exportHighlight(id: IArticle['_id'], hasUnsavedChanges: boolean): Promise<void>;
    prepareHighlightForPreview(id: IArticle['_id']): Promise<string>;
    showHighlightExportButton(item: IArticle): boolean;
}

export const highlights: IHighlightsApi = {
    markItem,
    fetchHighlights,
    exportHighlight,
    prepareHighlightForPreview,
    showHighlightExportButton,
};
