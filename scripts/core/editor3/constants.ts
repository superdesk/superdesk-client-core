import {RICH_FORMATTING_OPTION} from 'superdesk-api';

export const EDITOR_BLOCK_TYPE = 'superdesk/editor3-block';

/**
 * used for embedding articles - see TGA-66
 */
export const MIME_TYPE_SUPERDESK_TEXT_ITEM = 'application/superdesk.item.text';

export enum CustomEditor3Entity {
    MEDIA = 'MEDIA',
    EMBED = 'EMBED',
    TABLE = 'TABLE',
    MULTI_LINE_QUOTE = 'MULTI-LINE_QUOTE',
    CUSTOM_BLOCK = 'CUSTOM_BLOCK',
    ARTICLE_EMBED = 'ARTICLE_EMBED',
}

export const formattingOptionsThatRequireDragAndDrop = new Set<RICH_FORMATTING_OPTION>([
    'media',
    'multi-line quote',
    'embed articles',
    'custom blocks',
]);
