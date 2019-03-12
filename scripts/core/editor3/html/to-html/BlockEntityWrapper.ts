import {ContentState} from 'draft-js';
/**
 * @ngdoc class
 * @name BlockEntityWrapper
 * @description This class is used as a helper for converting a DraftJS ContentBlock
 * to HTML.
 *
 * BlockEntityWrapper must be instantiated for each block and the `tags` method must
 * be called for each character in that block. The return value of this method will
 * be a string consisting of the appropriate tags needed to preceed the next
 * character. See the tags method for additional information.
 */
export class BlockEntityWrapper {
    activeEntity: any;
    contentState: ContentState;

    constructor(contentState) {
        this.activeEntity = null;
        this.contentState = contentState;
    }

    /**
     * @ngdoc method
     * @name BlockEntityWrapper#tags
     * @param {string|undefined} entityKey
     * @returns {string} HTML
     * @description Returns the appropriate HTML tag(s) needed to preceed the next
     * character which has the entity represented by entityKey. This method must be
     * called for each character in the block if it is to work correctly.
     */
    tags(entityKey) {
        if (!entityKey) {
            return this.flush();
        }

        if (this.isActive(entityKey)) {
            return '';
        }

        const entity = this.contentState.getEntity(entityKey);
        const type = entity.getType();
        const data = entity.getData();

        let html = this.flush();

        switch (type) {
        case 'LINK':
            this.activeEntity = {key: entityKey, tag: 'a'};

            if (data.url) {
                html += `<a href="${data.url}">`;
            } else {
                const link = data.link;

                if (link.attachment != null) {
                    html += `<a data-attachment="${link.attachment}">`;
                } else if (link.target != null) {
                    html += `<a href="${link.href}" target="${link.target}">`;
                } else {
                    html += `<a href="${link.href}">`;
                }
            }
        }

        return html;
    }

    /**
     * @ngdoc method
     * @name BlockEntityWrapper#isActive
     * @param {string} entityKey
     * @description Checks if the active entity has been entityKey.
     * @returns {Boolean} True if the passed entityKey has been the active one.
     */
    isActive(entityKey) {
        return this.activeEntity && this.activeEntity.key === entityKey;
    }

    /**
     * @ngdoc method
     * @name BlockEntityWrapper#flush
     * @description Returns the closing tag for any active entity.
     * @returns {string} Closing tag or empty string.
     */
    flush() {
        if (this.activeEntity === null) {
            return '';
        }

        const tag = `</${this.activeEntity.tag}>`;

        this.activeEntity = null;

        return tag;
    }
}
