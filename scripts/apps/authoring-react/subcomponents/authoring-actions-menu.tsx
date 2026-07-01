import React from 'react';
import {Menu} from 'superdesk-ui-framework/react';
import {IAuthoringAction} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {MoreActionsButton} from 'core/ui/components/MoreActionsButton';

interface IProps {
    getActions: () => Array<IAuthoringAction>;
}

interface IState {
    actions: Array<IAuthoringAction> | null;
}

/**
 * Menu items are computed only when the user opens the menu because some actions
 * depend on the latest authoring state.
 */
export class AuthoringActionsMenu extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            actions: null,
        };

        this.getActions = this.getActions.bind(this);
    }

    getActions() {
        this.setState({actions: this.props.getActions()});
    }

    toMenuItem(action: IAuthoringAction): IMenuItem {
        return {
            label: action.label,
            onClick: action.onTrigger,
            shortcut: (action.group?.id ?? action.groupId) === 'spellchecker'
                && action.label === gettext('Check spelling')
                ? 'Ctrl+Shift+Y'
                : undefined,
        };
    }

    private insertAction(
        action: IAuthoringAction,
        ungrouped: Array<IAuthoringAction>,
        groupsMap: Map<string, {
            label?: string;
            priority: number;
            actions: Array<IAuthoringAction>;
        }>,
    ) {
        if (action.group != null) {
            const existing = groupsMap.get(action.group.id);

            if (existing == null) {
                groupsMap.set(action.group.id, {
                    label: action.group.label,
                    priority: action.group.priority ?? 0,
                    actions: [action],
                });
            } else {
                existing.actions.push(action);

                if (existing.label == null && action.group.label != null) {
                    existing.label = action.group.label;
                }
            }
        } else if (action.groupId != null) {
            console.warn(
                'AuthoringAction "' + action.label + '" uses deprecated groupId "' + action.groupId + '". ' +
                'Migrate to the "group" attribute.',
            );

            // TODO: Remove this fallback once superdesk-planning migrates from groupId to group.
            const isPlanning = action.groupId === 'planning-actions';
            const fallbackLabel = isPlanning ? gettext('Planning') : undefined;
            const fallbackPriority = isPlanning ? 10 : 0;

            const existing = groupsMap.get(action.groupId);

            if (existing == null) {
                groupsMap.set(action.groupId, {
                    label: fallbackLabel,
                    priority: fallbackPriority,
                    actions: [action],
                });
            } else {
                existing.actions.push(action);
            }
        } else {
            ungrouped.push(action);
        }
    }

    getMenuItems(actions: Array<IAuthoringAction>): Array<IMenuItem> {
        const ungrouped: Array<IAuthoringAction> = [];
        const groupsMap = new Map<string, {
            label?: string;
            priority: number;
            actions: Array<IAuthoringAction>;
        }>();

        for (const action of actions) {
            this.insertAction(action, ungrouped, groupsMap);
        }

        const sortedGroups = Array.from(groupsMap.entries())
            .sort((a, b) => a[1].priority - b[1].priority);

        const menuItems: Array<IMenuItem> = [];

        if (ungrouped.length > 0) {
            menuItems.push(...ungrouped.map((action) => this.toMenuItem(action)));
        }

        for (const [, groupData] of sortedGroups) {
            if (menuItems.length > 0) {
                menuItems.push({separator: true});
            }

            const items = groupData.actions.map((action) => this.toMenuItem(action));

            if (groupData.label == null) {
                menuItems.push(...items);
            } else {
                menuItems.push({
                    type: 'group',
                    label: groupData.label,
                    children: items,
                });
            }
        }

        return menuItems;
    }

    render() {
        if (this.state.actions == null) {
            return (
                <MoreActionsButton
                    aria-label={gettext('Actions menu')}
                    onClick={this.getActions}
                />
            );
        } else {
            return (
                <Menu items={this.getMenuItems(this.state.actions)} data-test-id="actions-list">
                    {(toggle) => (
                        <MoreActionsButton
                            aria-label={gettext('Actions menu')}
                            onClick={toggle}
                            buttonRef={(el) => {
                                if (el != null) {
                                    setTimeout(() => {
                                        el.click();
                                    });
                                }
                            }}
                        />
                    )}
                </Menu>
            );
        }
    }
}
