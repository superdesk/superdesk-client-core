import {JSHandle, Locator} from '@playwright/test';
import {IUploadFile} from '../page-object-models/upload';

/**
 * Drops files on `target` the way an OS drag from a folder does.
 *
 * A real OS drag-and-drop cannot be driven from Playwright, so the files are
 * constructed inside the page and handed to a synthetic `drop` event. The bytes
 * cross the boundary base64-encoded because `evaluateHandle` arguments are
 * JSON-serialised.
 *
 * `DataTransfer.items.add(file)` fills both handles the drop handlers read:
 * `dataTransfer.files`, which `ItemAssociationDirective` counts and passes on to
 * the upload screen, and `dataTransfer.types`, where the `Files` entry is what
 * `getSuperdeskType` matches on.
 */
export async function dropFiles(target: Locator, files: Array<IUploadFile>): Promise<void> {
    const payload = files.map(({name, mimeType, buffer}) => ({
        base64: buffer.toString('base64'),
        name,
        type: mimeType,
    }));

    const dataTransfer = await target.page().evaluateHandle((entries) => {
        const transfer = new DataTransfer();

        for (const {base64, name, type} of entries) {
            const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

            transfer.items.add(new File([bytes], name, {type}));
        }

        return transfer;
    }, payload);

    await dispatchDrop(target, dataTransfer);
}

/**
 * Drops an existing article on `target` the way dragging a row out of the item
 * list does.
 *
 * `dragStart` (scripts/utils/dragging.ts) puts the serialised article under the
 * `application/superdesk.item.<type>` MIME type, and that type is also how the drop
 * handlers tell a Superdesk item from an external file. Only the id and the type
 * are read on this side of the drop: `ContentService.dropItem` re-fetches the
 * article from the API, so whatever the payload claims about it is replaced by the
 * server's copy.
 */
export async function dropArticle(
    target: Locator,
    article: {_id: string; type: string},
): Promise<void> {
    const dataTransfer = await target.page().evaluateHandle((item) => {
        const transfer = new DataTransfer();

        transfer.setData(`application/superdesk.item.${item.type}`, JSON.stringify({...item, _type: 'archive'}));

        return transfer;
    }, article);

    await dispatchDrop(target, dataTransfer);
}

async function dispatchDrop(target: Locator, dataTransfer: JSHandle<DataTransfer>): Promise<void> {
    /*
     * A real drag always raises `dragover` before `drop`, and the association field
     * handles both. The drop handler re-checks the media type on its own, so the
     * first event is fidelity to the gesture rather than a precondition.
     */
    await target.dispatchEvent('dragover', {dataTransfer});
    await target.dispatchEvent('drop', {dataTransfer});

    await dataTransfer.dispose();
}
