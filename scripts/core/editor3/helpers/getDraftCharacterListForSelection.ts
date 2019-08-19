import {EditorState, SelectionState, ContentBlock, CharacterMetadata} from 'draft-js';
import {List} from 'immutable';

/**
 * @ngdoc method
 * @name orderedMapGetRange
 * @returns {OrderedMap}
 */
function orderedMapGetRange(orderedMap, fromKey, toKey) {
    let firstItemFound = false;
    let lastItemFound = false;

    return orderedMap.filter((item) => {
        const itemKey = item.getKey();

        if (itemKey === fromKey) {
            firstItemFound = true;
        }
        if (itemKey === toKey) {
            lastItemFound = true;
        }

        if (itemKey === fromKey || itemKey === toKey) {
            return true;
        }

        return firstItemFound && !lastItemFound;
    });
}

export function getDraftCharacterListForSelection(
    editorState: EditorState,
    selection: SelectionState,
): List<CharacterMetadata> {
    // including all blocks

    if (selection.isCollapsed()) {
        return List();
    }

    const selectionStartKey = selection.getStartKey();
    const selectionEndKey = selection.getEndKey();

    const selectedBlocks = orderedMapGetRange(
        editorState.getCurrentContent().getBlockMap(),
        selectionStartKey,
        selectionEndKey,
    );

    const selectedCharacters = selectedBlocks
        .map((block: ContentBlock) => {
            const blockKey = block.getKey();

            if (
                selectionStartKey === selectionEndKey &&
                selectionStartKey === blockKey
            ) {
                return block
                    .getCharacterList()
                    .slice(
                        selection.getStartOffset(),
                        selection.getEndOffset(),
                    );
            } else if (blockKey === selectionStartKey) {
                return block
                    .getCharacterList()
                    .slice(selection.getStartOffset(), block.getLength());
            } else if (blockKey === selectionEndKey) {
                return block
                    .getCharacterList()
                    .slice(0, selection.getEndOffset());
            } else {
                return block.getCharacterList();
            }
        })
        .reduce((acc, item) => acc.concat(item));

    return selectedCharacters;
}
