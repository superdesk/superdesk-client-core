import {RICH_FORMATTING_OPTION} from 'superdesk-api';

export function getFormattingOptionsForTableLikeBlocks(): Array<RICH_FORMATTING_OPTION> {
    const options: {[K in RICH_FORMATTING_OPTION] : boolean} = {
        h1: true,
        h2: true,
        h3: true,
        h4: true,
        h5: true,
        h6: true,
        superscript: true,
        subscript: true,
        strikethrough: true,
        link: true,
        underline: true,
        italic: true,
        bold: true,
        'ordered list': true,
        'unordered list': true,
        pre: true,
        quote: true,

        uppercase: false,
        lowercase: false,
        undo: false,
        redo: false,
        'formatting marks': false,
        'remove format': false,
        'remove all format': false,
        tab: false,
        'tab as spaces': false,
        'multi-line quote': false,
        'custom blocks': false,
        table: false,
        media: false,
        'embed articles': false,
        annotation: false,
        comments: false,
        suggestions: false,
        embed: false,
    };

    return Object.entries(options)
        .filter(([_key, value]) => value === true)
        .map(([key]: [RICH_FORMATTING_OPTION, boolean]) => key);
}
