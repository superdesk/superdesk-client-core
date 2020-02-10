import {ISuperdesk, IArticle} from 'superdesk-api';

export function updateMarkedUser(superdesk: ISuperdesk, article: IArticle, patch: Partial<IArticle>): void {
    superdesk.entities.article.patch(
        article,
        patch,
        {patchDirectlyAndOverwriteAuthoringValues: true},
    );
}
