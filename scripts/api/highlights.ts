import {httpRequestJsonLocal} from 'core/helpers/network';
import {IHighlightResponse} from 'superdesk-api';

function markItem(highlightId: string, itemId: string): Promise<any> {
    return httpRequestJsonLocal({
        payload: {
            highlights: highlightId,
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

interface IHighlightsApi {
    markItem(highlighId: string, itemId: string): Promise<any>;
    fetchHighlights(): Promise<IHighlightResponse>;
}

export const highlights: IHighlightsApi = {
    markItem,
    fetchHighlights,
};
