import React from 'react';
import {Map} from 'immutable';
import {Menu} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {IArticle, IArticleAction, IExtensionActivationResult, IContentProfileV2} from 'superdesk-api';
import {getArticleActionsFromExtensions} from 'core/superdesk-api-helpers';
import {groupBy, flatMap} from 'lodash';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Menu';
import {extensions} from 'appConfig';

interface IProps {
    item: IArticle;
    contentProfile: IContentProfileV2;
    fieldsData: Map<string, unknown>;
    getCoreActions: () => Array<IArticleAction>;
}

interface IState {
    actions: Array<IArticleAction> | null;
}

function getAuthoringActionsFromExtensions(
    item: IArticle,
    contentProfile: IContentProfileV2,
    fieldsData: Map<string, unknown>,
): Promise<Array<IArticleAction>> {
    const actionGetters
        : Array<IExtensionActivationResult['contributions']['getAuthoringActions']>
    = flatMap(
        Object.values(extensions),
        (extension) => extension.activationResult.contributions?.getAuthoringActions ?? [],
    );

    return Promise.all(actionGetters.map((getPromise) => getPromise(item, contentProfile, fieldsData)))
        .then((res) => {
            return flatMap(res);
        });
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
        Promise.all([
            getAuthoringActionsFromExtensions(this.props.item, this.props.contentProfile, this.props.fieldsData),
            getArticleActionsFromExtensions(this.props.item),
        ]).then((res) => {
            const [authoringActionsFromExtensions, articleActionsFromExtensions] = res;

            this.setState({actions: [
                ...this.props.getCoreActions(), ...authoringActionsFromExtensions, ...articleActionsFromExtensions,
            ]});
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
