import {getStore} from '../../src/store';
import {receiveAssets} from '../../src/store/assets/actions';
import {closeAssetContentPanel} from '../../src/store/assets/actions';

import {superdeskApi, samsApi} from '../../src/apis';
import {LIST_ACTION} from '../interfaces';

export function onAssetCreated() {
	const store = getStore();
	const params = store?.getState().assets.searchParams
	const listStyle = store?.getState().assets.listStyle

	return samsApi.assets.query(params, listStyle)
		.then((response) => {
			store?.dispatch(
					receiveAssets(
							response,
							LIST_ACTION.REPLACE,
					),
			);
		});
}

export function onAssetUpdated() {
	const store = getStore();
	const params = store?.getState().assets.searchParams
	const listStyle = store?.getState().assets.listStyle

	return samsApi.assets.query(params, listStyle)
		.then((response) => {
			store?.dispatch(
					receiveAssets(
							response,
							LIST_ACTION.REPLACE,
					),
			);
		});
}

export function onAssetDeleted(event: any) {
    const {notify} = superdeskApi.ui;
	const store = getStore();
	const params = store?.getState().assets.searchParams
	const listStyle = store?.getState().assets.listStyle
    const user_id = superdeskApi.session.getCurrentUserId();

	return samsApi.assets.query(params, listStyle)
		.then((response) => {
			store?.dispatch(
					receiveAssets(
							response,
							LIST_ACTION.REPLACE,
					),
			);
			const selectedAssetId = store?.getState().assets.selectedAssetId;
			const item_id =  event.detail.extra.item_id
			if (selectedAssetId === item_id) {
				store?.dispatch(closeAssetContentPanel())
				if (user_id !== event.detail.extra.user_id) {
					notify.info('Asset was deleted by another user.');
				}
			}
			const selectedAssetIds = store?.getState().assets.selectedAssetIds;

			if (selectedAssetIds.includes(event.detail.extra.item_id)) {
				selectedAssetIds.splice(selectedAssetIds.indexOf(item_id), 1);
			}
		});
}

export function onAssetLocked(event: any) {
	const item_id =  event.detail.extra.item_id

	const store = getStore();
	if (store?.getState().assets.assets[item_id]) {
		const params = store?.getState().assets.searchParams
		const listStyle = store?.getState().assets.listStyle

		return samsApi.assets.query(params, listStyle)
		.then((response) => {
			store?.dispatch(
					receiveAssets(
							response,
							LIST_ACTION.REPLACE,
					),
			);
		});
	}
	else {
		return undefined
	}
}

export function onAssetUnlocked(event: any) {
	const item_id =  event.detail.extra.item_id

	const store = getStore();
	if (store?.getState().assets.assets[item_id]) {
		const params = store?.getState().assets.searchParams
		const listStyle = store?.getState().assets.listStyle

		return samsApi.assets.query(params, listStyle)
		.then((response) => {
			store?.dispatch(
					receiveAssets(
							response,
							LIST_ACTION.REPLACE,
					),
			);
		});
	} else {
		return undefined
	}
}

export function onSessionUnlocked(event: any) {
    const session_id = event.detail.extra.session_id 
	const store = getStore();

	const assets = store?.getState().assets.assets
	Object.keys(assets).forEach((key) => {
		if (assets[key].lock_session === session_id) {
			console.log(assets[key])
			store?.dispatch(
				receiveAssets(
						assets[key],
						LIST_ACTION.REPLACE,
				),
		);
		}
	});
}
