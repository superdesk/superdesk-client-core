export interface ISpellcheckerSuggestion {
    text: string;
}

export interface ISpellcheckWarning {
    // zero-based; line breaks are counted as single characters.
    startOffset: number;

    // offending text fragment. Can consist of multiple words. Can NOT span multiple paragraphs.
    text: string;

    // list of text fragments suggested to replace offending text fragment.
    // Can consist of multiple words. Can NOT span multiple paragraphs.
    // Can be omited if `ISpellchecker['getSuggestions']` method is defined.
    suggestions?: Array<ISpellcheckerSuggestion>;
}

export interface ISpellcheckerAction {
    label: string;
    perform: (warning: ISpellcheckWarning) => Promise<void>;
}

export interface ISpellchecker {
    // text - formatting-free text, can be multiline
    check(text: string): Promise<Array<ISpellcheckWarning>>;

    // text - formatting-free text, must be single-line
    // can be ommited if suggestions are provided in `ISpellcheckWarning`s returned from the `check` method.
    getSuggestions?(text: string): Promise<Array<ISpellcheckerSuggestion>>;

    actions: {[key: string]: ISpellcheckerAction};
}
