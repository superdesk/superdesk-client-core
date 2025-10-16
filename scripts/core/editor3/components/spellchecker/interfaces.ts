export interface ISpellcheckerSuggestion {
    text: string;
}

export interface ISpellcheckWarning {
    // zero-based; line breaks are counted as single characters.
    startOffset: number;

    // offending text fragment. Can consist of multiple words. Can NOT span multiple paragraphs.
    text: string;

    type: 'spelling' | 'grammar';

    // list of text fragments suggested to replace offending text fragment.
    // Can consist of multiple words. Can NOT span multiple paragraphs.
    // Can be omitted if `ISpellchecker['getSuggestions']` method is defined.
    suggestions?: Array<ISpellcheckerSuggestion>;

    // Could be used to add context on why text fragment was marked as offending.
    explanation?: string;
}

export interface ISpellcheckerAction {
    icon?: string;
    label: string;
    perform: (warning: ISpellcheckWarning) => Promise<void>;
}

export interface ISpellchecker {
    // text - formatting-free text, can be multiline
    check(text: string, abortSignal: AbortSignal): Promise<Array<ISpellcheckWarning>>;

    // text - formatting-free text, must be single-line
    // can be ommited if suggestions are provided in `ISpellcheckWarning`s returned from the `check` method.
    getSuggestions?(text: string): Promise<Array<ISpellcheckerSuggestion>>;

    actions: {[key: string]: ISpellcheckerAction};
}
