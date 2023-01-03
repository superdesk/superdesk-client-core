import _, {noop} from 'lodash';
import React from 'react';
import classNames from 'classnames';
import {Item} from './index';
import {isCheckAllowed, closeActionsMenu, bindMarkItemShortcut} from '../helpers';
import {isMediaEditable} from 'core/config';
import {gettext, IScopeApply} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {AuthoringWorkspaceService} from 'apps/authoring/authoring/services/AuthoringWorkspaceService';
import ng from 'core/services/ng';
import {IMultiSelectOptions} from 'core/MultiSelectHoc';
import {IActivityService} from 'core/activity/activity';
import {isButtonClicked} from './Item';
import {querySelectorParent} from 'core/helpers/dom/querySelectorParent';
import {IRelatedEntities} from 'core/getRelatedEntities';
import {OrderedMap} from 'immutable';
import {MultiSelect} from 'core/ArticlesListV2MultiSelect';
import {ErrorBoundary} from 'core/helpers/ErrorBoundary';

interface IProps {
    itemsList: Array<string>;
    itemsById: any;
    relatedEntities: IRelatedEntities;
    narrow: boolean;
    view: 'compact' | 'mgrid' | 'photogrid';
    selected: string;
    swimlane: any;
    profilesById: any;
    highlightsById: any;
    markedDesksById: any;
    desksById: any;
    ingestProvidersById: any;
    usersById: any;
    onMonitoringItemSelect: any;
    onMonitoringItemDoubleClick: any;
    singleLine: any;
    customRender: any;
    flags: {
        hideActions: any;
    };
    hideActionsForMonitoringItems: boolean;
    groupId: any;
    viewColumn: any;
    loading: any;
    scopeApply: IScopeApply;
    scopeApplyAsync: IScopeApply;
    edit(item: IArticle): void;
    preview(item: IArticle): void;
    multiSelect?: IMultiSelectNew | ILegacyMultiSelect;
}

export interface ILegacyMultiSelect {
    kind: 'legacy';
    multiSelect(item: IArticle, selected: boolean, multiSelectMode: boolean): void;
    setSelectedItem(itemId: string): void;
}

export interface IMultiSelectNew {
    kind: 'new';
    options: IMultiSelectOptions<IArticle>;
    items: OrderedMap<string, IArticle>;
    MultiSelectComponent: typeof MultiSelect;
}

interface IState {
    bindedShortcuts: Array<any>;
    actioning: {};
}

/**
 * Item list component
 */
export class ItemList extends React.Component<IProps, IState> {
    updateTimeout: any;
    selectedCom: any;
    angularservices: {
        $rootScope: any;
        $timeout: any;
        activityService: IActivityService;
        archiveService: any;
        authoringWorkspace: AuthoringWorkspaceService;
        keyboardManager: any;
        Keys: any;
        monitoringState: any;
        multi: any;
        search: any;
        storage: any;
        superdesk: any;
        workflowService: any;
    };

    focusableElement: HTMLUListElement | null;

    constructor(props) {
        super(props);

        this.state = {
            bindedShortcuts: [],
            actioning: {},
        };

        this.select = this.select.bind(this);
        this.selectItem = this.selectItem.bind(this);
        this.dbClick = this.dbClick.bind(this);
        this.edit = this.edit.bind(this);
        this.deselectAll = this.deselectAll.bind(this);
        this.setSelectedItem = this.setSelectedItem.bind(this);
        this.getSelectedItem = this.getSelectedItem.bind(this);
        this.handleKey = this.handleKey.bind(this);
        this.setSelectedComponent = this.setSelectedComponent.bind(this);
        this.modifiedUserName = this.modifiedUserName.bind(this);
        this.multiSelectCurrentItem = this.multiSelectCurrentItem.bind(this);
        this.bindActionKeyShortcuts = this.bindActionKeyShortcuts.bind(this);
        this.unbindActionKeyShortcuts = this.unbindActionKeyShortcuts.bind(this);

        this.angularservices = {
            $rootScope: ng.get('$rootScope'),
            $timeout: ng.get('$timeout'),
            activityService: ng.get('activityService'),
            archiveService: ng.get('archiveService'),
            authoringWorkspace: ng.get('authoringWorkspace'),
            keyboardManager: ng.get('keyboardManager'),
            Keys: ng.get('Keys'),
            monitoringState: ng.get('monitoringState'),
            multi: ng.get('multi'),
            search: ng.get('search'),
            storage: ng.get('storage'),
            superdesk: ng.get('superdesk'),
            workflowService: ng.get('workflowService'),
        };
    }

    // Method to check the selectBox of the selected item
    multiSelectCurrentItem() {
        if (this.props.multiSelect.kind !== 'legacy') {
            throw new Error('Legacy multiselect API expected.');
        }

        const selectedItem = this.getSelectedItem();

        if (selectedItem) {
            this.props.multiSelect.multiSelect(selectedItem, !selectedItem.selected, false);
        }
    }

    select(item: IArticle, event) {
        // Don't select item / open preview when a button is clicked.
        // The button can be three dots menu, bulk actions checkbox, a button to preview existing highlights etc.
        if (isButtonClicked(event)) {
            return;
        }

        if (event.type === "focus" && item === this.getSelectedItem()) {
            // when returning to same screen and item is already selected
            // this should be noop
            return;
        }

        if (typeof this.props.onMonitoringItemSelect === 'function') {
            this.props.onMonitoringItemSelect(item, event);
            return;
        }

        const {$timeout} = this.angularservices;

        this.setSelectedItem(item);

        if (event && event.ctrlKey) {
            return this.selectItem(item);
        }

        $timeout.cancel(this.updateTimeout);

        if (item && this.props.preview != null) {
            this.props.scopeApply(() => {
                this.props.preview(item);
                this.bindActionKeyShortcuts(item);
            });
        }
    }

    /*
     * Unbind all item actions
     */
    unbindActionKeyShortcuts(callback?) {
        const {keyboardManager} = this.angularservices;

        this.state.bindedShortcuts.forEach((shortcut) => {
            keyboardManager.unbind(shortcut);
        });
        this.setState({bindedShortcuts: []}, callback);
    }

    /*
     * Bind item actions on keyboard shortcuts
     * Keyboard shortcuts are defined with actions
     *
     * @param {Object} item
     */
    bindActionKeyShortcuts(selectedItem) {
        const {
            activityService,
            archiveService,
            keyboardManager,
            superdesk,
            workflowService,
        } = this.angularservices;

        const doBind = () => {
            const intent = {action: 'list', type: archiveService.getType(selectedItem)};

            superdesk.findActivities(intent, selectedItem).forEach((activity) => {
                if (activity.keyboardShortcut && workflowService.isActionAllowed(selectedItem, activity.action)) {
                    this.state.bindedShortcuts.push(activity.keyboardShortcut);

                    keyboardManager.bind(activity.keyboardShortcut, () => {
                        if (_.includes(['mark.item', 'mark.desk'], activity._id)) {
                            bindMarkItemShortcut(activity.label);
                        } else {
                            activityService.start(activity, {data: {item: selectedItem}});
                        }
                    });
                }
            });
        };

        // First unbind all binded shortcuts
        if (this.state.bindedShortcuts.length) {
            this.unbindActionKeyShortcuts(() => {
                doBind();
            });
        } else {
            doBind();
        }
    }

    selectItem(item) {
        if (this.props.multiSelect.kind !== 'legacy') {
            throw new Error('Legacy multiselect API expected.');
        }

        if (isCheckAllowed(item)) {
            const selected = !item.selected;

            this.props.multiSelect.multiSelect(item, selected, false);
        }
    }

    setActioning(item: IArticle, isActioning: boolean) {
        const {search} = this.angularservices;
        const actioning = Object.assign({}, this.state.actioning);
        const itemId = search.generateTrackByIdentifier(item);

        actioning[itemId] = isActioning;
        this.setState({actioning});
    }

    dbClick(item) {
        if (typeof this.props.onMonitoringItemDoubleClick === 'function') {
            this.props.onMonitoringItemDoubleClick(item);
            return;
        }

        const {superdesk, $timeout} = this.angularservices;
        const {authoringWorkspace} = this.angularservices;

        const activities = superdesk.findActivities({action: 'list', type: item._type}, item);
        const canEdit = _.reduce(activities, (result, value) => result || value._id === 'edit.item', false);

        this.setSelectedItem(item);
        $timeout.cancel(this.updateTimeout);

        if (this.props.flags?.hideActions) {
            return;
        }

        if (item._type === 'externalsource') {
            if (!isMediaEditable(item)) {
                return;
            }
            this.setActioning(item, true);
            superdesk.intent('list', 'externalsource', {item: item}, 'fetch-externalsource')
                .then((archiveItem) => {
                    archiveItem.guid = archiveItem._id; // fix item guid to match new item _id
                    this.props.scopeApplyAsync(() => {
                        if (this.props.edit != null) {
                            this.props.edit(archiveItem);
                        } else {
                            authoringWorkspace.open(archiveItem);
                        }
                    });
                })
                .finally(() => {
                    this.setActioning(item, false);
                });
        } else if (canEdit && this.props.edit != null) {
            this.props.scopeApply(() => {
                this.props.edit(item);
            });
        } else {
            this.props.scopeApply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    edit(item: IArticle, event) {
        const {authoringWorkspace} = this.angularservices;
        const {$timeout} = this.angularservices;

        if (this.props.selected !== item._id) {
            this.select(item, event);
        }

        $timeout.cancel(this.updateTimeout);

        if (this.props.flags?.hideActions || item == null) {
            return;
        }

        if (this.props.edit != null) {
            this.props.scopeApply(() => {
                this.props.edit(item);
            });
        } else {
            this.props.scopeApply(() => {
                authoringWorkspace.open(item);
            });
        }
    }

    deselectAll() {
        if (this.props.multiSelect.kind !== 'legacy') {
            throw new Error('Legacy multiselect API expected.');
        }

        this.props.multiSelect.setSelectedItem(null);
        this.unbindActionKeyShortcuts();
    }

    setSelectedItem(item: IArticle) {
        if (this.props.multiSelect.kind !== 'legacy') {
            throw new Error('Legacy multiselect API expected.');
        }

        const {monitoringState, $rootScope, search} = this.angularservices;

        if (monitoringState.state.activeGroup !== this.props.groupId) {
            // If selected item is from another group, deselect all
            $rootScope.$broadcast('item:unselect');
            monitoringState.setState({activeGroup: this.props.groupId});
        }

        this.props.multiSelect.setSelectedItem(item ? search.generateTrackByIdentifier(item) : null);
    }

    getSelectedItem() {
        const selected = this.props.selected;

        return this.props.itemsById[selected];
    }

    handleKey(event) {
        if (querySelectorParent(event.target, 'button', {self: true}) != null) {
            // don't execute key bindings when a button inside the list item is focused.
            return;
        }

        // don't do anything when modifier key is pressed
        // this allows shortcuts defined in activities to work without two actions firing for one shortcut
        if (event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }

        const {Keys, monitoringState} = this.angularservices;
        const KEY_CODES = Object.freeze({
            X: 'X'.charCodeAt(0),
        });

        let diff;

        const moveActiveGroup = (_event) => {
            _event.preventDefault();
            _event.stopPropagation();
            this.deselectAll(); // deselect active item

            const keyCode = _event.keyCode;

            this.props.scopeApplyAsync(() => {
                monitoringState.moveActiveGroup(keyCode === Keys.pageup ? -1 : 1);
            });
        };

        const openItem = (_event) => {
            if (this.props.selected) {
                this.edit(this.getSelectedItem(), _event);
            }

            event.stopPropagation();
        };

        const performMultiSelect = () => {
            event.preventDefault();
            event.stopPropagation();
            this.multiSelectCurrentItem();
        };

        switch (event.keyCode) {
        case Keys.right:
        case Keys.down:
            diff = 1;
            closeActionsMenu();
            break;

        case Keys.left:
        case Keys.up:
            diff = -1;
            closeActionsMenu();
            break;

        case Keys.enter:
            openItem(event);
            closeActionsMenu();
            break;

        case Keys.pageup:
        case Keys.pagedown:
            moveActiveGroup(event);
            closeActionsMenu();
            break;

        case KEY_CODES.X:
            performMultiSelect();
            closeActionsMenu();
            break;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            const nextEl = document.activeElement.nextElementSibling;

            if (nextEl instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focued that is outside of the viewport.
                event.preventDefault();

                nextEl.focus();
            }
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            const prevEl = document.activeElement.previousElementSibling;

            if (prevEl instanceof HTMLElement) {
                // Don't scroll the list. The list will be scrolled automatically
                // when an item is focued that is outside of the viewport.
                event.preventDefault();

                prevEl.focus();
            }
        }
    }

    componentWillUnmount() {
        this.unbindActionKeyShortcuts();
        closeActionsMenu();
    }

    setSelectedComponent(com) {
        this.selectedCom = com;
    }

    modifiedUserName(versionCreator) {
        return this.props.usersById[versionCreator] ?
            this.props.usersById[versionCreator].display_name : null;
    }

    focus() {
        if (this.focusableElement == null) {
            return;
        }

        // Focus only if a child item doesn't already have focus.
        // Otherwise, it always re-focuses the entire list after clicking a particular item
        // and user is unable to use keyboard shortcuts on an item that was clicked.
        if (this.focusableElement.contains(document.activeElement) === false) {
            this.focusableElement.focus();
        }
    }

    render() {
        const {storage} = this.angularservices;
        const isEmpty = !this.props.itemsList.length;

        if (this.props.loading) {
            return (
                <ul
                    className="list-view list-without-items"
                    tabIndex={-1}
                    ref={(el) => {
                        this.focusableElement = el;
                    }}
                    data-test-id="item-list--loading"
                >
                    <li>{gettext('Loading...')}</li>
                </ul>
            );
        } else if (isEmpty) {
            return (
                <ul
                    className="list-view list-without-items"
                    tabIndex={-1}
                    ref={(el) => {
                        this.focusableElement = el;
                    }}
                >
                    <li>{gettext('There are currently no items')}</li>
                </ul>
            );
        }

        return (
            <ul
                className={classNames(
                    this.props.view === 'photogrid' ?
                        'sd-grid-list sd-grid-list--no-margin' :
                        (this.props.view || 'compact') + '-view list-view',
                )}
                onClick={closeActionsMenu}
                onKeyDown={(event) => {
                    this.handleKey(event);
                }}
                tabIndex={-1}
                ref={(el) => {
                    this.focusableElement = el;
                }}
            >
                {
                    this.props.itemsList.map((itemId) => {
                        const item = this.props.itemsById[itemId];
                        const task = item.task || {desk: null};

                        return (
                            <ErrorBoundary key={itemId}>
                                <Item
                                    isNested={false}
                                    item={item}
                                    relatedEntities={this.props.relatedEntities}
                                    view={this.props.view}
                                    swimlane={this.props.swimlane || storage.getItem('displaySwimlane')}
                                    flags={{selected: this.props.selected === itemId}}
                                    onEdit={this.edit}
                                    onDbClick={this.dbClick}
                                    onSelect={this.select}
                                    ingestProvider={this.props.ingestProvidersById[item.ingest_provider] || null}
                                    desk={this.props.desksById[task.desk] || null}
                                    highlightsById={this.props.highlightsById}
                                    markedDesksById={this.props.markedDesksById}
                                    profilesById={this.props.profilesById}
                                    versioncreator={this.modifiedUserName(item.version_creator)}
                                    narrow={this.props.narrow}
                                    hideActions={
                                        this.props.hideActionsForMonitoringItems || this.props.flags?.hideActions
                                    }
                                    multiSelectDisabled={this.props.multiSelect == null}
                                    actioning={!!this.state.actioning[itemId]}
                                    singleLine={this.props.singleLine}
                                    customRender={this.props.customRender}
                                    scopeApply={this.props.scopeApply}
                                    multiSelect={this.props.multiSelect ?? {
                                        kind: 'legacy',
                                        multiSelect: noop,
                                        setSelectedItem: noop,
                                    }}
                                />
                            </ErrorBoundary>
                        );
                    })
                }
            </ul>
        );
    }
}
