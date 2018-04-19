// Adding the following because planning webpack when compiled for test cases
// won't be aware of gettext.
const gettext = _.get(window, 'gettext', (text) => text);

/**
 * Menu groups for authoring
 */
export const AUTHORING_MENU_GROUPS = [
    {_id: 'default', label: gettext('Actions')},
    {_id: 'duplicate', label: gettext('Duplicate'), concate: true},
    {_id: 'packaging'},
    {_id: 'highlights'},
    {_id: 'corrections'},
];