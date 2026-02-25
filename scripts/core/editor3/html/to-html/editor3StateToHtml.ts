import {ContentState, ContentBlock, DraftInlineStyle} from 'draft-js';
import {AtomicBlockParser} from '.';
import {getAnnotationsFromContentState} from 'core/editor3/helpers/editor3CustomData';
import {stateToHTML} from 'draft-js-export-html';
import {trimStartExact, trimEndExact} from 'core/helpers/utils';
import {customEditorTags} from 'apps/workspace/content/components/get-content-profiles-form-config';
import {CUSTOM_EDITOR_TAG_ATTR} from '../../components/customStyleMap';

export const editor3StateToHtml = (
    contentState: ContentState,
    disabled: Array<string> = [], // A set of disabled elements (ie. ['table'] will ignore
    tagStylesOverride?: Set<string>,
): string => {
    const annotationsByStyleName = getAnnotationsFromContentState(contentState)
        .reduce((accumulator, item) => ({...accumulator, [item.styleName]: item}), {});
    const tagStyles = tagStylesOverride ?? new Set(customEditorTags.map(({editor3Style}) => editor3Style));

    let options = {
        inlineStyles: {
            BOLD: {element: 'b'},
            ITALIC: {element: 'i'},
            STRIKETHROUGH: {element: 's'},
            SUBSCRIPT: {element: 'sub'},
            SUPERSCRIPT: {element: 'sup'},
        },
        entityStyleFn: (entity: Draft.EntityInstance) => {
            if (entity.getType() === 'LINK') {
                const data = entity.getData();

                if (data.url) {
                    return {
                        element: 'a',
                        attributes: {href: data.url},
                    };
                } else {
                    const link = data.link;

                    if (link.attachment != null) {
                        return {
                            element: 'a',
                            attributes: {'data-attachment': link.attachment},
                        };
                    } else if (link.target != null) {
                        return {
                            element: 'a',
                            attributes: {href: link.href, target: link.target},
                        };
                    } else {
                        return {
                            element: 'a',
                            attributes: {href: link.href},
                        };
                    }
                }
            }
        },

        blockRenderers: {
            atomic: (block: ContentBlock) => new AtomicBlockParser(contentState, disabled).parse(block),
        },

        inlineStyleFn: (styles: DraftInlineStyle) => {
            let annotationStyleName = styles.find((styleName: string) => annotationsByStyleName[styleName] != null);

            if (annotationStyleName != null) {
                return {
                    element: 'span',
                    attributes: {
                        'annotation-id': annotationsByStyleName[annotationStyleName].id,
                    },
                };
            }

            const styleValue = styles.find((style) => tagStyles.has(style));

            if (styleValue != null) {
                return {
                    element: 'span',
                    attributes: {
                        [CUSTOM_EDITOR_TAG_ATTR]: styleValue,
                    },
                };
            }
        },
    };

    /*
        If an atomic block is the only content in the editor, it automatically gets line breaks around it.
        trimStartExact & trimEndExact gets rid of those line breaks.
        .trim() at the end removes whitespace.
    */
    var res = trimStartExact(
        trimEndExact(
            stateToHTML(contentState, options),
            '<p><br></p>',
        ),
        '<p><br></p>',
    ).trim();

    return res;
};
