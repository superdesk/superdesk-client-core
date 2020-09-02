import {ContentState, ContentBlock, DraftInlineStyle} from 'draft-js';
import {AtomicBlockParser} from '.';
import {getAnnotationsFromContentState} from 'core/editor3/helpers/editor3CustomData';
import {stateToHTML} from 'draft-js-export-html';
import {trimStartExact, trimEndExact} from 'core/helpers/utils';

export const editor3StateToHtml = (
    contentState: ContentState,
    disabled: Array<string> = [], // A set of disabled elements (ie. ['table'] will ignore
) => {
    const annotationsByStyleName = getAnnotationsFromContentState(contentState)
        .reduce((accumulator, item) => ({...accumulator, [item.styleName]: item}), {});

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
                        attributes: {href: data.url, title: link.title},
                    };
                } else {
                    const link = data.link;

                    if (link.attachment != null) {
                        return {
                            element: 'a',
                            attributes: {'data-attachment': link.attachment},
                        };
                    } else if (link.href != undefined && link.href !== "") {


                        let atts = {};
                        if(link.href !== undefined && link.href !== "")
                            atts.href = link.href;
                        if(link.nofollow !== undefined && link.nofollow !== "")
                            atts.rel = link.nofollow;
                        if(link.title !== undefined && link.title !== "")
                            atts.title = link.title;
                        if(link.target !== undefined && link.target !== "")
                            atts.target = link.target;


                        return {
                            element: 'a',
                            attributes: atts,
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
        },
    };

    console.log(options);

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