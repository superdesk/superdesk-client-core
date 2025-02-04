import {applyMiddleware as coreApplyMiddleware} from 'core/middleware';
import {onChangeMiddleware} from '../index';
import {IArticle} from 'superdesk-api';
import {extensions} from 'appConfig';

export function runBeforeUpdateMiddlware(item: IArticle, orig: IArticle): Promise<IArticle> {
    return coreApplyMiddleware(onChangeMiddleware, {item: item, original: orig}, 'item')
        .then(() => {
            const onUpdateFromExtensions = Object.values(extensions).map(
                (extension) => extension.activationResult?.contributions?.authoring?.onUpdateBefore,
            ).filter((updateFn) => updateFn != null);

            return (
                onUpdateFromExtensions.length < 1
                    ? Promise.resolve(item)
                    : onUpdateFromExtensions
                        .reduce(
                            (current, next) => current.then(
                                (result) => next(orig._autosave ?? orig, result),
                            ),
                            Promise.resolve(item),
                        )
            );
        });
}

export function runAfterUpdateEvent(previous: IArticle, current: IArticle) {
    const onUpdateAfterFromExtensions = Object.values(extensions).map(
        (extension) => extension.activationResult?.contributions?.authoring?.onUpdateAfter,
    ).filter((fn) => fn != null);

    onUpdateAfterFromExtensions.forEach((fn) => {
        fn(previous, current);
    });
}
