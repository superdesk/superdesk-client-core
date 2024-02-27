import React from 'react';
import {groupBy} from 'lodash';
import {Menu} from 'superdesk-ui-framework/react';
import {IAuthoringAction} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {ActionButton} from 'core/ui/components/ActionButton';

interface IProps {
    getActions: () => Array<IAuthoringAction>;
}

interface IState {
    actions: Array<IAuthoringAction> | null;
}

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
                <ActionButton
                    ariaValue={gettext('Actions menu')}
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
                            <ActionButton
                                ariaValue={gettext('Actions menu')}
                                refValue={(el) => {
                                    if (el != null) {
                                        setTimeout(() => {
                                            el.click();
                                        });
                                    }
                                }}
                                onClick={toggle}
                            />
                        )}
                    </Menu>
                </div>
            );
        }
    }
}
