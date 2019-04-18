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
    // text - formatting-free text, can be multiline
    check(text: string): Promise<Array<ISpellcheckWarning>>;

    // text - formatting-free text, must be single-line
    getSuggestions(text: string): Promise<Array<string>>;

    actions: {[key: string]: ISpellcheckerAction};
}
