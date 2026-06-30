import React from 'react';
import {Dropdown} from 'superdesk-ui-framework/react';
import {IAuthoringAction} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IMenuGroup, IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';
import {MoreActionsButton} from 'core/ui/components/MoreActionsButton';

interface IProps {
    getActions: () => Array<IAuthoringAction>;
}

interface IState {
    actions: Array<IAuthoringAction> | null;
}

type IDropdownMenuItem = IMenuItem | IMenuGroup | 'divider';

const ACTION_GROUPS = {
    general: 'general',
    planning: 'planning-actions',
    highlights: 'highlights',
    translations: 'translations',
    spellchecker: 'spellchecker',
};

const rowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
};
const actionsButtonSelector = '[data-test-id="actions-list"] [data-test-id="actions-button"]';
const runAutomaticallySwitchSelector = '[data-test-id="spellchecker-run-automatically-switch"]';

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
        this.closeMenu = this.closeMenu.bind(this);
    }

    getActions() {
        this.setState({actions: this.props.getActions()});
    }

    closeMenu() {
        this.setState({actions: null});
    }

    componentDidUpdate(_prevProps: IProps, prevState: IState) {
        if (prevState.actions == null && this.state.actions != null) {
            setTimeout(() => {
                document.querySelector<HTMLButtonElement>(actionsButtonSelector)?.click();
            });
        }
    }

    getActionLabel(action: IAuthoringAction): string | JSX.Element {
        if (this.isRunAutomaticallyAction(action)) {
            return (
                <span
                    style={rowStyles}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.triggerRunAutomatically(action, event.currentTarget.querySelector('.sd-switch'));
                    }}
                >
                    <span>{action.label}</span>
                    <span
                        className={`sd-switch ${action.icon === 'toggle-on' ? 'checked' : ''}`}
                        data-test-id="spellchecker-run-automatically-switch"
                    >
                        <span className="inner" />
                    </span>
                </span>
            );
        }

        if (action.groupId === ACTION_GROUPS.spellchecker && action.label === gettext('Check spelling')) {
            return (
                <span style={rowStyles}>
                    <span>{action.label}</span>
                    <span className="shortcut">Ctrl+Shift+Y</span>
                </span>
            );
        }

        return action.label;
    }

    isRunAutomaticallyAction(action: IAuthoringAction): boolean {
        return action.groupId === ACTION_GROUPS.spellchecker && action.label === gettext('Run automatically');
    }

    triggerRunAutomatically(action: IAuthoringAction, switchElement?: Element | null) {
        const enabled = action.icon !== 'toggle-on';

        action.icon = enabled ? 'toggle-on' : 'toggle-off';
        (switchElement ?? document.querySelector(runAutomaticallySwitchSelector))?.classList.toggle('checked', enabled);
        action.onTrigger();
    }

    toDropdownItem(action: IAuthoringAction): IMenuItem {
        return {
            label: this.getActionLabel(action),
            onSelect: () => {
                if (this.isRunAutomaticallyAction(action)) {
                    this.triggerRunAutomatically(action);
                } else {
                    action.onTrigger();
                    this.closeMenu();
                }
            },
        };
    }

    addSection(
        menuItems: Array<IDropdownMenuItem>,
        actions: Array<IAuthoringAction>,
        label?: string,
    ) {
        if (actions.length < 1) {
            return;
        }

        if (menuItems.length > 0) {
            menuItems.push('divider');
        }

        const items = actions.map((action) => this.toDropdownItem(action));

        if (label == null) {
            menuItems.push(...items);
        } else {
            menuItems.push({
                type: 'group',
                label,
                items,
            });
        }
    }

    getMenuItems(actions: Array<IAuthoringAction>): Array<IDropdownMenuItem> {
        const knownGroups = Object.values(ACTION_GROUPS);
        const actionsForGroup = (groupId: string) => actions.filter((action) => action.groupId === groupId);
        const generalActions = actions.filter((action) => {
            const groupId = action.groupId;

            return groupId == null
                || groupId === ACTION_GROUPS.general
                || knownGroups.includes(groupId) !== true;
        });
        const menuItems: Array<IDropdownMenuItem> = [];

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
                <div data-test-id="actions-list">
                    <Dropdown
                        align="right"
                        items={this.getMenuItems(this.state.actions)}
                    >
                        <button
                            className="sd-navbtn"
                            aria-label={gettext('Actions menu')}
                            data-test-id="actions-button"
                        >
                            <i className="icon-dots-vertical" />
                        </button>
                    </Dropdown>
                </div>
            );
        }
    }
}
