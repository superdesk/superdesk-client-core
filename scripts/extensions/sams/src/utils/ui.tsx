// External Modules
import * as React from 'react';
import {Provider} from 'react-redux';

// Types
import {ASSET_SORT_FIELD, ASSET_STATE, DATA_UNIT, IAssetItem, RENDITION} from '../interfaces';
import {superdeskApi} from '../apis';

// Redux Actions & Selectors
import {getStore} from '../store';

// UI
import {Label} from 'superdesk-ui-framework/react';

export function showModalConnectedToStore<T = any>(
    Component: React.ComponentType<{closeModal(): void} & any>,
    props?: T,
): Promise<void> {
    const store = getStore();

    if (store == null) {
        return Promise.reject('SAMS store has not been initialised');
    }

    return superdeskApi.ui.showModal(
        ({closeModal}) => (
            <Provider store={store}>
                <Component closeModal={closeModal} {...props ?? {}} />
            </Provider>
        ),
    );
}

export function getHumanReadableFileSize(fileSize: number): string {
    if (fileSize < 1024) {
        return fileSize + 'bytes';
    } else if (fileSize < 1048576) {
        return (fileSize / 1024).toFixed(1) + 'KB';
    } else {
        return (fileSize / 1048576).toFixed(1) + 'MB';
    }
}

export function getIconTypeFromMimetype(mimetype: string) {
    if (mimetype.startsWith('image/')) {
        return 'photo';
    } else if (mimetype.startsWith('video/')) {
        return 'video';
    } else if (mimetype.startsWith('audio/')) {
        return 'audio';
    } else {
        return 'text';
    }
}

export function getFileSizeFromHumanReadable(fileSize: number, dataUnit: DATA_UNIT) {
    switch (dataUnit) {
    case DATA_UNIT.BYTES:
        return fileSize;
    case DATA_UNIT.KB:
        return fileSize * 1024;
    case DATA_UNIT.MB:
        return fileSize * 1024 * 1024;
    case DATA_UNIT.GB:
        return fileSize * 1024 * 1024 * 1024;
    }
}

export function getAssetStateLabel(assetState: ASSET_STATE) {
    const {gettext} = superdeskApi.localization;

    switch (assetState) {
    case ASSET_STATE.INTERNAL:
        return (
            <Label
                text={gettext('Internal')}
                style="hollow"
                color="red--800"
            />
        );
    case ASSET_STATE.DRAFT:
        return (
            <Label
                text={gettext('Draft')}
                style="hollow"
                type="warning"
            />
        );
    case ASSET_STATE.PUBLIC:
        return (
            <Label
                text={gettext('Public')}
                style="hollow"
                type="success"
            />
        );
    }

    superdeskApi.helpers.assertNever(assetState);
}

export function getAssetListSortFieldText(field: ASSET_SORT_FIELD): string {
    const {gettext} = superdeskApi.localization;

    switch (field) {
    case ASSET_SORT_FIELD.NAME:
        return gettext('Name');
    case ASSET_SORT_FIELD.FILENAME:
        return gettext('Filename');
    case ASSET_SORT_FIELD.SIZE:
        return gettext('Size');
    case ASSET_SORT_FIELD.CREATED:
        return gettext('Created');
    case ASSET_SORT_FIELD.UPDATED:
        return gettext('Updated');
    }

    superdeskApi.helpers.assertNever(field);
}

export function getAssetRenditionDimension(asset: IAssetItem, rendition: RENDITION) {
    const {gettext} = superdeskApi.localization;

    const dimensions = asset.renditions.find((r) => r?.name === rendition)?.params!;

    return gettext('{{width}} * {{height}}', {width: dimensions?.width, height: dimensions?.height});
}
