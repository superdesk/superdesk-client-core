export const EDITOR_BLOCK_TYPE = 'superdesk/editor3-block';

/**
 * used embedding articles - see TGA-66
 */
export const MIME_TYPE_SUPERDESK_TEXT_ITEM = 'application/superdesk.item.text';

export enum CustomEditor3Entity {
    MEDIA = 'MEDIA',
    EMBED = 'EMBED',
    TABLE = 'TABLE',
    MULTI_LINE_QUOTE = 'MULTI-LINE_QUOTE',
    ARTICLE_EMBED = 'ARTICLE_EMBED',
}
