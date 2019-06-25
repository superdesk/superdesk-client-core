import content from './content';
import monitoring from './monitoring';
import {nav, wait as waitFor} from './utils';
import {element, by, browser} from 'protractor';

class Workspace {
    sideMenu: any;
    open: () => any;
    openContent: () => any;
    openIngest: () => any;
    openPersonal: () => any;
    getDesk: any;
    getCurrentDesk: any;
    selectDesk: (desk: any) => void;
    createWorkspace: (name: any) => void;
    showList: (name: any) => void;
    showHighlightList: (name: any) => void;
    getHighlightListItem: any;
    getItems: any;
    getItem: (index: any) => any;
    getItemText: (index: any) => any;
    openItemMenu: any;
    actionOnItem: (action: any, item: any) => void;
    actionOnItemSubmenu: (action: any, submenu: any, item: any, linkTypeBtn?: any) => void;
    switchToDesk: any;
    selectStage: any;
    editItem: (item: any, desk?: any) => any;
    duplicateItem: (item: any, desk: any) => any;

    constructor() {
        this.sideMenu = element(by.id('side-menu'));
        function openContent() {
            return nav('workspace/content');
        }

        function openIngest() {
            return nav('workspace/ingest');
        }

        function openPersonal() {
            return nav('workspace/personal');
        }

        this.open = this.openContent = openContent;
        this.openIngest = openIngest;
        this.openPersonal = openPersonal;

        this.getDesk = function(name) {
            var desks = element.all(by.repeater('desk in userDesks'));

            return desks.all(by.css('[option="' + name.toUpperCase() + '"]'));
        };

        this.getCurrentDesk = function() {
            var dropdownBtn = element(by.id('selected-desk'));

            return dropdownBtn.element(by.css('[ng-if="selected.name"]')).getText();
        };

        /**
         * Open a workspace of given name, can be both desk or custom
         *
         * @param {string} desk Desk or workspace name.
         */
        this.selectDesk = function(desk) {
            var dropdownBtn = element(by.id('selected-desk')),
                dropdownMenu = element(by.id('select-desk-menu'));

            // open dropdown
            dropdownBtn.click();

            function textFilter(elem) {
                return elem.element(by.tagName('button')).getText()
                    .then((text) => text.toUpperCase().indexOf(desk.toUpperCase()) >= 0);
            }

            function clickFiltered(filtered) {
                if (filtered.length) {
                    return filtered[0].click();
                }
            }

            // try to open desk
            dropdownMenu.all(by.repeater('desk in desks'))
                .filter(textFilter)
                .then(clickFiltered);

            // then try to open custom workspace
            dropdownMenu.all(by.repeater('workspace in wsList'))
                .filter(textFilter)
                .then(clickFiltered);

            // close dropdown if opened
            dropdownMenu.isDisplayed().then((shouldClose) => {
                if (shouldClose) {
                    dropdownBtn.click();
                }
            });
        };

        this.createWorkspace = function(name) {
            var dropdownBtn = element(by.id('selected-desk'));

            dropdownBtn.click();

            var newWorkspaceBtn = element(by.className('action-btn'));

            newWorkspaceBtn.click();

            var workspaceName = element(by.model('workspace.name'));

            workspaceName.sendKeys(name);

            element(by.css('[ng-click="save()"]')).click();
        };

        /**
         * Show name list from right menu
         *
         * @param {string} name
         */
        this.showList = function(name) {
            this.sideMenu.element(by.css('[title="' + name + '"]')).click();
        };

        /**
         * Show the name highlight list
         *
         * @param {string} name
         */
        this.showHighlightList = function(name) {
            var item = this.getHighlightListItem(name);

            waitFor(item);
            item.click();
        };

        /**
         * Get highlight list item by name
         *
         * @param {string} name
         *
         * @return {promise} highlight element
         */
        this.getHighlightListItem = function(name) {
            var menu = element(by.id('highlightPackage'));

            browser.actions()
                .mouseMove(menu)
                .perform();

            return menu.element(by.css('[option="' + name + '"]'));
        };

        /**
         * Get the list of items from list
         *
         * @return {promise} list of elements
         */
        this.getItems = function() {
            return element.all(by.className('media-box'));
        };

        /**
         * Get the item at 'index' from list
         *
         * @param {number} index
         * @return {promise} element
         */
        this.getItem = function(index) {
            return this.getItems().get(index);
        };

        /** Get the title of the 'index' element
         * of the list
         *
         * @param {number} index
         * @return {promise} title
         */
        this.getItemText = function(index) {
            return this.getItem(index)
                .all(by.id('title'))
                .first()
                .getText();
        };

        /**
         * Open contextual menu for item
         *
         * @param {number} index
         * @return {promise} menu element
         */
        this.openItemMenu = function(index) {
            var itemElem = this.getItem(index);

            browser.actions()
                .mouseMove(itemElem)
                .perform();
            itemElem.element(by.className('icon-dots-vertical')).click();
            return element(by.css('.dropdown__menu.open'));
        };

        /**
         * Perform the 'action' operation on the
         * 'item' element
         *
         * @param {string} action
         * @param {number} item
         */
        this.actionOnItem = function(action, item) {
            var menu = this.openItemMenu(item);

            menu.element(by.partialLinkText(action)).click();
        };

        /**
         * Perform 'submenu' operation on the 'action' menu from
         * 'item' element
         *
         * @param {string} action
         * @param {string} submenu
         * @param {number} item
         */
        this.actionOnItemSubmenu = function(action, submenu, item, linkTypeBtn) {
            var menu = this.openItemMenu(item);

            browser.actions()
                .mouseMove(menu.element(by.partialLinkText(action)))
                .perform();
            menu.element(linkTypeBtn ? by.partialLinkText(submenu) : by.partialButtonText(submenu)).click();
        };

        /**
         * Open a workspace of given name, can be both desk or custom and then navigate
         * to content view
         *
         * @param {string} desk Desk or workspace name.
         * @return {Promise}
         */
        this.switchToDesk = function(desk) {
            this.selectDesk(desk);
            openContent();

            browser.wait(() => element(by.className('list-view')).isPresent(), 300);

            // toggle to list view if possible
            var listViewBtn = element(by.className('view-select'))
                .all(by.tagName('button'))
                .get(1);

            return listViewBtn.isDisplayed().then((isDisplayed) => {
                if (isDisplayed) {
                    return listViewBtn.click();
                }
            });
        };

        this.selectStage = function(stage) {
            var stages = element(by.css('.desk-stages'));

            return stages.element(by.cssContainingText('.stage-label', stage)).click();
        };

        this.editItem = function(item, desk) {
            this.switchToDesk(desk || 'PERSONAL');
            content.setListView();
            return content.editItem(item);
        };

        this.duplicateItem = function(item, desk) {
            return this.switchToDesk(desk || 'PERSONAL')
                .then(content.setListView)
                .then(() => monitoring.actionOnItemSubmenu('Duplicate', 'Duplicate in place', item, true));
        };
    }
}

export const workspace = new Workspace();
export default workspace;
