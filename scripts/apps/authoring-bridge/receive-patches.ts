import {registerInternalExtension, unregisterInternalExtension} from 'core/helpers/register-internal-extension';
import {IArticle} from 'superdesk-api';

const receivingPatchesInternalExtension = 'receiving-patches-internal-extension';

export function registerToReceivePatches(articleId: IArticle['_id'], applyPatch: (patch: Partial<IArticle>) => void) {
    registerInternalExtension(receivingPatchesInternalExtension, {
        contributions: {
            entities: {
                article: {
                    onPatchBefore: (id, patch, dangerousOptions) => {
                        if (
                            articleId === id
                            && dangerousOptions?.patchDirectlyAndOverwriteAuthoringValues !== true
                        ) {
                            applyPatch(patch);
                            console.info('Article is locked and can\'t be updated via HTTP directly.'
                            + 'The updates will be added to existing diff in article-edit view instead.');

                            return Promise.reject();
                        } else {
                            return Promise.resolve(patch);
                        }
                    },
                },
            },
        },
    });
}

export function unregisterFromReceivingPatches() {
    unregisterInternalExtension(receivingPatchesInternalExtension);
}
