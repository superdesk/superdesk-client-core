export interface ISpellcheckWarning {
    // zero-based, line-break agnostic index
    startOffset: number;

    // offending text fragment. Can consist of multiple words. Can NOT span multiple paragraphs.
    text: string;

    // list of text fragments suggested to replace offending text fragment.
    // Can consist of multiple words. Can NOT span multiple paragraphs.
    suggestions: Array<string>;
}

export interface ISpellchecker {
    check(
        // formatting-free text, can be multiline
        text: string,
    ): Array<ISpellcheckWarning>;
}
