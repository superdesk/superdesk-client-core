import {sortBy} from 'lodash';

export default function WorkspaceMenuProvider() {
    const items = [];

    /**
     * Register workspace menu item
     *
     * @param {Object} config
     * @return {Object} WorkspaceMenuProvider
     */
    this.item = (config) => {
        items.push(Object.assign({order: 1000}, config));
        return this; // allow chaining
    };

    /**
     * Get registered items
     */
    this.$get = () => sortBy(items, 'order');
}