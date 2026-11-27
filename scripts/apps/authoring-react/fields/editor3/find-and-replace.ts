import {Store} from 'redux';
import {setHighlightCriteria, findNext} from 'core/editor3/actions';

/**
 * A new search pattern leaves no match selected (index -1) and Replace acts only on the selected match,
 * so the first match gets selected straight away, as in angular's find and replace.
 */
export function setFindCriteria(store: Store<any>, text: string, caseSensitive: boolean): void {
    store.dispatch(setHighlightCriteria({diff: {[text]: null}, caseSensitive}));

    if (text !== '' && store.getState().searchTerm.index === -1) {
        store.dispatch(findNext());
    }
}
