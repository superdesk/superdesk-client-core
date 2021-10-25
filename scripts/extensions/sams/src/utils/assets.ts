import {
    ASSET_ACTIONS,
    IAssetAction,
    IAutoTaggingSearchResult,
    IAssetTag,
    IAssetCallback,
    IAssetItem,
    IBaseAssetAction,
    IBulkActionAssetCallback,
    IBulkAction,
} from '../interfaces';
import {IMenuItem} from 'superdesk-ui-framework/react/components/Dropdown';
import {OrderedMap} from 'immutable';

import {superdeskApi} from '../apis';
import {getSetsSync} from '../api/assets';

const isActionAllowed: {[key: string]: (asset: Partial<IAssetItem>) => boolean} = {
    [ASSET_ACTIONS.PREVIEW]: (asset) => (
        asset._created != null
    ),
    [ASSET_ACTIONS.DOWNLOAD]: (asset) => (
        asset._created != null
    ),
    [ASSET_ACTIONS.DELETE]: (asset) => (
        asset._created != null &&
        !isAssetLocked(asset)
    ),
    [ASSET_ACTIONS.EDIT]: (asset) => (
        asset._created != null &&
        isSetDisabled(asset) &&
        isAssetLockedInCurrentSession(asset)
    ),
    [ASSET_ACTIONS.FORCE_UNLOCK]: (asset) => (
        asset._created != null &&
        isAssetLocked(asset)
    ),
    [ASSET_ACTIONS.VIEW_FULL_SCREEN]: (asset) => (
        isImageAsset(asset)
    ),
};

function getBaseAssetAction(action: ASSET_ACTIONS): IBaseAssetAction {
    const {gettext} = superdeskApi.localization;
    const {assertNever} = superdeskApi.helpers;

    switch (action) {
    case ASSET_ACTIONS.PREVIEW:
        return {
            id: ASSET_ACTIONS.PREVIEW,
            label: gettext('Preview'),
            icon: 'eye-open',
        };
    case ASSET_ACTIONS.DOWNLOAD:
        return {
            id: ASSET_ACTIONS.DOWNLOAD,
            label: gettext('Download'),
            icon: 'download',
        };
    case ASSET_ACTIONS.DELETE:
        return {
            id: ASSET_ACTIONS.DELETE,
            label: gettext('Delete'),
            icon: 'trash',
        };
    case ASSET_ACTIONS.EDIT:
        return {
            id: ASSET_ACTIONS.EDIT,
            label: gettext('Edit'),
            icon: 'pencil',
        };
    case ASSET_ACTIONS.FORCE_UNLOCK:
        return {
            id: ASSET_ACTIONS.FORCE_UNLOCK,
            label: gettext('Force Unlock'),
            icon: 'unlocked',
        };
    case ASSET_ACTIONS.VIEW_FULL_SCREEN:
        return {
            id: ASSET_ACTIONS.VIEW_FULL_SCREEN,
            label: gettext('Full-screen preview'),
            icon: 'fullscreen',
        };
    }

    assertNever(action);
}

export function getActions(asset: Partial<IAssetItem>, actions?: Array<IAssetCallback>): Array<IAssetAction> {
    return actions == null || actions.length === 0 ?
        [] :
        actions
            .map((actionCallback) => ({
                ...getBaseAssetAction(actionCallback.action),
                onSelect: actionCallback.onSelect,
                isAllowed: isActionAllowed[actionCallback.action],
            }))
            .filter((action) => action.isAllowed(asset));
}

export function getBulkActions(
    assets: Array<IAssetItem>,
    actions: Array<IBulkActionAssetCallback>,
): Array<IBulkAction> {
    return actions
        .filter((action) => (
            assets.every(
                (asset) => isActionAllowed[action.action](asset),
            )
        ))
        .map((action) => ({
            ...getBaseAssetAction(action.action),
            onSelect: action.onSelect,
        }));
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

export function isAssetLockedInCurrentSession(asset: Partial<IAssetItem>): boolean {
    const userId = superdeskApi.session.getCurrentUserId();
    const sessionId = superdeskApi.session.getSessionId();

    return !isAssetLocked(asset) || (
        asset.lock_session === sessionId &&
        asset.lock_user === userId
    );
}

export function convertTagSearchResultToAssetTags(response: IAutoTaggingSearchResult): OrderedMap<string, IAssetTag> {
    let tags = OrderedMap<string, IAssetTag>();

    response.tags.forEach((item: string) => {
        const tag: IAssetTag = {
            name: item,
            code: item,
        };

        tags = tags.set(tag.name!, tag);
        tags = tags.set(tag.code!, tag);
    });
    return tags;
}

export function isImageAsset(asset: Partial<IAssetItem>): boolean {
    return asset.mimetype?.startsWith('image/') ?? false;
}

export function isVideoAsset(asset: Partial<IAssetItem>): boolean {
    return asset.mimetype?.startsWith('video/') ?? false;
}

export function isAudioAsset(asset: Partial<IAssetItem>): boolean {
    return asset.mimetype?.startsWith('audio/') ?? false;
}
