export interface ISpellcheckWarning {
    // zero-based, line-break agnostic index
    startOffset: number;

    // offending text fragment. Can consist of multiple words. Can NOT span multiple paragraphs.
    text: string;

    // list of text fragments suggested to replace offending text fragment.
    // Can consist of multiple words. Can NOT span multiple paragraphs.
    suggestions: Array<string>;
}

export interface ISpellcheckerAction {
    label: string;
    perform: (warning: ISpellcheckWarning) => Promise<void>;
}

export interface ISpellchecker {
    check(
        // formatting-free text, can be multiline
        text: string,
    ): Promise<Array<ISpellcheckWarning>>;

    actions: Array<ISpellcheckerAction>;
}
