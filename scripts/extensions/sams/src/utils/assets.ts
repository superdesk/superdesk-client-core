import {ASSET_ACTIONS, IAssetAction, IAssetItem, IAssetCallback} from '../interfaces';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';

import {superdeskApi} from '../apis';
import {getSetsSync} from '../api/assets';

export function getAction(assetCallback: IAssetCallback): IAssetAction {
    const {gettext} = superdeskApi.localization;
    const {assertNever} = superdeskApi.helpers;

    switch (assetCallback.action) {
    case ASSET_ACTIONS.PREVIEW:
        return {
            id: ASSET_ACTIONS.PREVIEW,
            label: gettext('Preview'),
            icon: 'eye-open',
            onSelect: assetCallback.onSelect,
            isAllowed: (asset) => asset._created != null,
        };
    case ASSET_ACTIONS.DOWNLOAD:
        return {
            id: ASSET_ACTIONS.DOWNLOAD,
            label: gettext('Download'),
            icon: 'download',
            onSelect: assetCallback.onSelect,
            isAllowed: (asset) => asset._created != null,
        };
    case ASSET_ACTIONS.DELETE:
        return {
            id: ASSET_ACTIONS.DELETE,
            label: gettext('Delete'),
            icon: 'trash',
            onSelect: assetCallback.onSelect,
            isAllowed: (asset) => asset._created != null && isAssetLockedByCurrentUser(asset),
        };
    case ASSET_ACTIONS.EDIT:
        return {
            id: ASSET_ACTIONS.EDIT,
            label: gettext('Edit'),
            icon: 'pencil',
            onSelect: assetCallback.onSelect,
            isAllowed: (asset) => asset._created != null && isSetDisabled(asset) && isAssetLockedByCurrentUser(asset),
        };
    case ASSET_ACTIONS.FORCE_UNLOCK:
        return {
            id: ASSET_ACTIONS.FORCE_UNLOCK,
            label: gettext('Force Unlock'),
            icon: 'unlocked',
            onSelect: assetCallback.onSelect,
            isAllowed: (asset) => asset._created != null && isAssetLocked(asset),
        };
    }

    assertNever(assetCallback.action);
}

export function getActions(asset: Partial<IAssetItem>, actions?: Array<IAssetCallback>): Array<IAssetAction> {
    return actions == null || actions.length === 0 ?
        [] :
        actions
            .map((actionCallback) => getAction(actionCallback))
            .filter((action) => action.isAllowed(asset));
}

export function getDropdownItemsForActions(
    asset: Partial<IAssetItem>,
    requestedActions?: Array<IAssetCallback>,
): Array<IMenuItem> {
    const allowedActions = getActions(asset, requestedActions);

    if (allowedActions.length > 0) {
        return allowedActions.map(
            (action) => ({
                label: action.label,
                icon: action.icon,
                onSelect: () => action.onSelect(asset),
            }),
        );
    }

    return [];
}

export function getMimetypeHumanReadable(mimetype?: string): string {
    const {gettext} = superdeskApi.localization;

    if (mimetype == null || mimetype.length === 0) {
        return '';
    } else if (mimetype.startsWith('image/')) {
        return gettext('Image');
    } else if (mimetype.startsWith('video/')) {
        return gettext('Video');
    } else if (mimetype.startsWith('audio/')) {
        return gettext('Audio');
    } else if (mimetype === 'application/pdf') {
        return gettext('PDF');
    } else if (mimetype === 'text/plain') {
        return gettext('Text');
    } else if (mimetype.includes('document')) {
        return gettext('Document');
    } else {
        return gettext('Other');
    }
}

export function verifyAssetBeforeLocking(asset: Partial<IAssetItem>, lock_action?: string): boolean {
    const session_id = superdeskApi.session.getSessionId();
    const user_id = superdeskApi.session.getCurrentUserId();

    if (asset.lock_action === lock_action && asset.lock_session === session_id && asset.lock_user === user_id) {
        return true;
    } else {
        return false;
    }
}

export function isAssetLocked(asset: Partial<IAssetItem>): boolean {
    if (asset.lock_session != null) {
        return true;
    } else {
        return false;
    }
}

export function isSetDisabled(asset: Partial<IAssetItem>): boolean {
    const sets = getSetsSync();

    if (sets[asset.set_id!].state === 'disabled') {
        return false;
    } else {
        return true;
    }
}

export function isAssetLockedByCurrentUser(asset: Partial<IAssetItem>): boolean {
    const user_id = superdeskApi.session.getCurrentUserId();

    if (asset.lock_user === user_id || !isAssetLocked(asset)) {
        return true;
    } else {
        return false;
    }
}
