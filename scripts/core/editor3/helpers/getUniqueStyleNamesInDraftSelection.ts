import {ContentState} from 'draft-js';

export const getUniqueStyleNames = (contentState: ContentState) => {
    const styles = {};

    contentState.getBlockMap().forEach((block) => {
        block.getCharacterList().forEach((char) => {
            char.getStyle().forEach((styleName) => {
                styles[styleName] = true;
            });
        });
    });

    return Object.keys(styles);
};
