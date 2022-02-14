import React from 'react';
import {Menu} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {IArticle, IArticleAction} from 'superdesk-api';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {groupBy} from 'lodash';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';

interface IProps {
    item: IArticle;
    getCoreActions: () => Array<IArticleAction>;
}

interface IState {
    actions: Array<IArticleAction> | null;
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
        getArticleActionsFromExtensions(this.props.item).then((actionsFromExtensions) => {
            this.setState({actions: [...this.props.getCoreActions(), ...actionsFromExtensions]});
        });
    }

    render() {
        if (this.state.actions == null) {
            return (
                <button
                    onClick={() => {
                        this.getActions();
                    }}
                    className="sd-navbtn"
                    aria-label={gettext('Actions menu')}
                >
                    <i className="icon-dots-vertical" />
                </button>
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
                <Menu items={menuItems}>
                    {(toggle) => (
                        <button
                            onClick={(e) => {
                                toggle(e);
                            }}
                            className="sd-navbtn"
                            aria-label={gettext('Actions menu')}
                            ref={(el) => {
                                if (el != null) {
                                    setTimeout(() => {
                                        el.click();
                                    });
                                }
                            }}
                        >
                            <i className="icon-dots-vertical" />
                        </button>
                    )}
                </Menu>
            );
        }
    }
}
