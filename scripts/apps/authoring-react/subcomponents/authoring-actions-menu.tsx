import React from 'react';
import {groupBy} from 'lodash';
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
 * Menu component requires providing actions up-front
 * while here we don't want to compute them unless user initiates opening of the menu.
 * To work around this, we render a button, when it is clicked we fetch the items
 * and replace the button with an actual Menu component.
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

    render() {
        if (this.state.actions == null) {
            return (
                <MoreActionsButton
                    aria-label={gettext('Actions menu')}
                    onClick={this.getActions}
                />
            );
        } else {
            const actionsGrouped = groupBy(this.state.actions, (action) => action.groupId);
            const menuItems: Array<IMenuItem> = [];

            for (const actions of Object.values(actionsGrouped)) {
                if (menuItems.length > 0) {
                    menuItems.push({separator: true});
                }

                const menuItemsGroup = actions.map((action) => ({
                    label: action.label,
                    onClick: () => {
                        action.onTrigger();
                        this.setState({actions: null});
                    },
                }));

                menuItems.push(...menuItemsGroup);
            }

            return (
                <div>
                    <Menu items={menuItems}>
                        {(toggle) => (
                            <div
                                ref={(el) => {
                                    // open immediately on mount

                                    if (el != null) {
                                        const button = el.querySelector('button');

                                        if (button != null) {
                                            setTimeout(() => {
                                                button.click();
                                            });
                                        }
                                    }
                                }}
                            >
                                <MoreActionsButton
                                    aria-label={gettext('Actions menu')}
                                    onClick={toggle}
                                />
                            </div>
                        )}
                    </Menu>
                </div>
            );
        }
    }
}
