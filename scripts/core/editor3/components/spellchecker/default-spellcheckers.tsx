import ng from 'core/services/ng';
import {ISpellchecker, ISpellcheckerAction, ISpellcheckWarning, ISpellcheckerSuggestion} from './interfaces';
import {httpRequestJsonLocal} from 'core/helpers/xhr';

const actions: {[key: string]: ISpellcheckerAction} = {
    addToDictionary: {
        label: gettext('Add to dictionary'),
        perform: (warning: ISpellcheckWarning) => ng.getService('spellcheck').then((spellcheck) => {
            spellcheck.addWord(warning.text, false);
        }),
    },
    ignoreWord: {
        label: gettext('Ignore word'),
        perform: (warning: ISpellcheckWarning) => ng.getService('spellcheck').then((spellcheck) => {
            spellcheck.addWord(warning.text, false);
        }),
    },
};

function getSuggestions(text: string): Promise<Array<ISpellcheckerSuggestion>> {
    return ng.getService('spellcheck')
        .then((spellcheck) => spellcheck.suggest(text))
        .then((result: Array<{value: string}>) => result.map(({value}) => ({text: value})));
}

function check(str: string): Promise<Array<ISpellcheckWarning>> {
    const spellcheck = ng.get('spellcheck');

    return spellcheck.getDict()
        .then(() => {
            const info: Array<ISpellcheckWarning> = [];
            const WORD_REGEXP = /[0-9a-zA-Z\u00C0-\u1FFF\u2C00-\uD7FF]+/g;
            const regex = WORD_REGEXP;

            let lastOffset = 0;

            let matchArr;
            let start;

            // tslint:disable-next-line no-conditional-assignment
            while ((matchArr = regex.exec(str)) !== null) {
                start = matchArr.index;
                if (!spellcheck.isCorrectWord(matchArr[0])) {
                    info.push({
                        startOffset: lastOffset + start,
                        text: matchArr[0],
                        suggestions: null,
                        type: 'spelling',
                    });
                }
            }

            return info;
        });
}

export function getSpellchecker(language: string): ISpellchecker {
    const spellcheckerName = ({
        fr: 'grammalecte',
        nl: 'leuven_dutch',
    })[language];

    if (spellcheckerName != null) {
        return {
            check: (str: string) => httpRequestJsonLocal<{errors: Array<ISpellcheckWarning>}>({
                method: 'POST',
                payload: {spellchecker: spellcheckerName, text: str},
                path: '/spellchecker',
            }).then((json) => json.errors),
            getSuggestions: (str) => httpRequestJsonLocal<ISpellcheckWarning>({
                method: 'POST',
                payload: {spellchecker: spellcheckerName, text: str, suggestions: true},
                path: '/spellchecker',
            }).then((spellcheckerWarning) => spellcheckerWarning.suggestions),
            actions: {},
        };
    } else {
        return {check, getSuggestions, actions};
    }
}
