/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
import {assertNever} from 'core/helpers/typescript-helpers';
import {DeskAndStage} from './subcomponents/desk-and-stage';
import {LockInfo} from './subcomponents/lock-info';
import {Button, NavButton} from 'superdesk-ui-framework/react';
import {
    IArticle,
    ITopBarWidget,
    IExposedFromAuthoring,
    IAuthoringOptions,
} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {ITEM_STATE} from 'apps/archive/constants';
import React from 'react';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {AuthoringIntegrationWrapper} from './authoring-integration-wrapper';
import ng from 'core/services/ng';

export interface IProps {
    itemId: IArticle['_id'];
}

function onClose() {
    ng.get('authoringWorkspace').close();
    ng.get('$rootScope').$applyAsync();
}

function getInlineToolbarActions(options: IExposedFromAuthoring<IArticle>): IAuthoringOptions<IArticle> {
    const {
        item,
        hasUnsavedChanges,
        handleUnsavedChanges,
        save,
        initiateClosing,
        keepChangesAndClose,
        stealLock,
    } = options;
    const itemState: ITEM_STATE = item.state;

    const saveButton: ITopBarWidget<IArticle> = {
        group: 'end',
        priority: 0.2,
        component: () => (
            <Button
                text={gettext('Save')}
                style="filled"
                type="primary"
                disabled={!hasUnsavedChanges()}
                onClick={() => {
                    save();
                }}
            />
        ),
        availableOffline: true,
    };

    const closeButton: ITopBarWidget<IArticle> = {
        group: 'end',
        priority: 0.1,
        component: () => (
            <Button
                text={gettext('Close')}
                style="hollow"
                onClick={() => {
                    initiateClosing();
                }}
            />
        ),
        availableOffline: true,
    };

    const minimizeButton: ITopBarWidget<IArticle> = {
        group: 'end',
        priority: 0.3,
        component: () => (
            <NavButton
                text={gettext('Minimize')}
                onClick={() => {
                    keepChangesAndClose();
                }}
                icon="minimize"
                iconSize="big"
            />
        ),
        availableOffline: true,
    };

    switch (itemState) {
    case ITEM_STATE.DRAFT:
        return {
            readOnly: false,
            actions: [saveButton, minimizeButton],
        };

    case ITEM_STATE.SUBMITTED:
    case ITEM_STATE.IN_PROGRESS:
    case ITEM_STATE.ROUTED:
    case ITEM_STATE.FETCHED:
    case ITEM_STATE.UNPUBLISHED:
        // eslint-disable-next-line no-case-declarations
        const actions: Array<ITopBarWidget<IArticle>> = [
            minimizeButton,
            closeButton,
        ];

        actions.push({
            group: 'start',
            priority: 0.2,
            component: ({entity}) => <DeskAndStage article={entity} />,
            availableOffline: false,
        });

        // FINISH: ensure locking is available in generic version of authoring
        actions.push({
            group: 'start',
            priority: 0.1,
            component: ({entity}) => (
                <LockInfo
                    article={entity}
                    unlock={() => {
                        stealLock();
                    }}
                />
            ),
            availableOffline: false,
        });

        if (sdApi.article.isLockedInCurrentSession(item)) {
            actions.push(saveButton);
        }

        if (
            sdApi.article.isLockedInCurrentSession(item)
            && appConfig.features.customAuthoringTopbar.toDesk === true
            && sdApi.article.isPersonal(item) !== true
        ) {
            actions.push({
                group: 'middle',
                priority: 0.2,
                component: () => (
                    <Button
                        text={gettext('TD')}
                        style="filled"
                        onClick={() => {
                            handleUnsavedChanges()
                                .then(() => sdApi.article.sendItemToNextStage(item))
                                .then(() => initiateClosing());
                        }}
                    />
                ),
                availableOffline: false,
            });
        }

        return {
            readOnly: sdApi.article.isLockedInCurrentSession(item) !== true,
            actions: actions,
        };

    case ITEM_STATE.INGESTED:
        return {
            readOnly: true,
            actions: [], // fetch
        };

    case ITEM_STATE.SPIKED:
        return {
            readOnly: true,
            actions: [], // un-spike
        };

    case ITEM_STATE.SCHEDULED:
        return {
            readOnly: true,
            actions: [], // un-schedule
        };

    case ITEM_STATE.PUBLISHED:
    case ITEM_STATE.CORRECTED:
        return {
            readOnly: true,
            actions: [], // correct update kill takedown
        };

    case ITEM_STATE.BEING_CORRECTED:
        return {
            readOnly: true,
            actions: [], // cancel correction
        };

    case ITEM_STATE.CORRECTION:
        return {
            readOnly: false,
            actions: [], // cancel correction, save, publish
        };

    case ITEM_STATE.KILLED:
    case ITEM_STATE.RECALLED:
        return {
            readOnly: true,
            actions: [], // NONE
        };
    default:
        assertNever(itemState);
    }
}

export class AuthoringAngularIntegration extends React.PureComponent<IProps> {
    render(): React.ReactNode {
        return (
            <div className="sd-authoring-react">
                <AuthoringIntegrationWrapper
                    itemId={this.props.itemId}
                    onClose={onClose}
                    getInlineToolbarActions={getInlineToolbarActions}
                />
            </div>
        );
    }
}
