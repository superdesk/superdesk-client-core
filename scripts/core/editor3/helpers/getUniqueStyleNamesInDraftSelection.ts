import {getDraftCharacterListForSelection} from './getDraftCharacterListForSelection';

export const getUniqueStyleNamesInDraftSelection = (editorState, selection) => Object.keys(
    getDraftCharacterListForSelection(editorState, selection)
        .reduce((obj, item) => {
            item.getStyle().forEach((styleName) => {
                obj[styleName] = true;
            });
            return obj;
        }, {})
);