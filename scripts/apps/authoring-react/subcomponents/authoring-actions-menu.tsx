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

const ACTION_GROUPS = {
    general: 'general',
    planning: 'planning-actions',
    highlights: 'highlights',
    translations: 'translations',
    spellchecker: 'spellchecker',
};

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

    isRunAutomaticallyAction(action: IAuthoringAction): boolean {
        return action.groupId === ACTION_GROUPS.spellchecker && action.label === gettext('Run automatically');
    }

    toMenuItem(action: IAuthoringAction): IMenuItem {
        if (this.isRunAutomaticallyAction(action)) {
            return {
                type: 'switch',
                label: action.label,
                value: action.icon === 'toggle-on',
                onChange: (value) => {
                    action.icon = value ? 'toggle-on' : 'toggle-off';
                    action.onTrigger();
                    this.setState((state) => ({
                        actions: state.actions == null ? null : [...state.actions],
                    }));
                },
            };
        }

        return {
            label: action.label,
            onClick: action.onTrigger,
            shortcut: action.groupId === ACTION_GROUPS.spellchecker && action.label === gettext('Check spelling')
                ? 'Ctrl+Shift+Y'
                : undefined,
        };
    }

    addSection(
        menuItems: Array<IMenuItem>,
        actions: Array<IAuthoringAction>,
        label?: string,
    ) {
        if (actions.length < 1) {
            return;
        }

        if (menuItems.length > 0) {
            menuItems.push({separator: true});
        }

        const items = actions.map((action) => this.toMenuItem(action));

        if (label == null) {
            menuItems.push(...items);
        } else {
            menuItems.push({
                type: 'group',
                label,
                children: items,
            });
        }
    }

    getMenuItems(actions: Array<IAuthoringAction>): Array<IMenuItem> {
        const knownGroups = Object.values(ACTION_GROUPS);
        const actionsForGroup = (groupId: string) => actions.filter((action) => action.groupId === groupId);
        const generalActions = actions.filter((action) => {
            const groupId = action.groupId;

            return groupId == null
                || groupId === ACTION_GROUPS.general
                || knownGroups.includes(groupId) !== true;
        });
        const menuItems: Array<IMenuItem> = [];

        this.addSection(menuItems, generalActions);
        this.addSection(menuItems, actionsForGroup(ACTION_GROUPS.planning), gettext('Planning'));
        this.addSection(menuItems, actionsForGroup(ACTION_GROUPS.highlights));
        this.addSection(menuItems, actionsForGroup(ACTION_GROUPS.translations), gettext('Translations'));
        this.addSection(menuItems, actionsForGroup(ACTION_GROUPS.spellchecker), gettext('Spell Checker'));

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
