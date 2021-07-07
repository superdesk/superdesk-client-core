// Types
import {IEvents, IPublicWebsocketMessages} from 'superdesk-api';
import {LIST_ACTION} from '../interfaces';

// Redux
import {getStoreSync} from '../store';
import {setCurrentDeskId} from '../store/workspace/actions';
import {updateAssetSearchParamsAndListItems} from '../store/assets/actions';
import {loadSingleDeskSamsSettings} from '../store/workspace/actions';
import {getSelectedSetId} from '../store/assets/selectors';
import {getAvailableSetsForDesk} from '../store/sets/selectors';

export function onActiveDeskChanged(event: IEvents['activeDeskChanged']) {
    const store = getStoreSync();

    store.dispatch<any>(setCurrentDeskId(event.desk));

    const state = store.getState();
    const currentSetId = getSelectedSetId(state);
    const availableSets = getAvailableSetsForDesk(state);

    // If the currently selected Set is not available in the new Desk
    // then change the set to `All Sets`
    if (currentSetId == null || !availableSets.includes(currentSetId)) {
        store.dispatch<any>(updateAssetSearchParamsAndListItems(
            {setId: undefined},
            LIST_ACTION.REPLACE,
        ));
    }
}

export function onDeskUpdated(event: CustomEvent<IPublicWebsocketMessages['resource:updated']>) {
    const store = getStoreSync();

    // If the Desk's SAMS Settings has changed, then reload these settings
    if (Object.keys(event.detail.extra.fields).includes('sams_settings')) {
        store.dispatch<any>(loadSingleDeskSamsSettings(event.detail.extra._id));
    }
}
