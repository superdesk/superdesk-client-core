import React from 'react';
import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {ISendToDestinationDesk} from 'core/interactive-article-actions-panel/interfaces';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {showModal} from '@superdesk/common';
import {IModalSimpleAction, ModalSimple} from 'core/ui/components/modal-simple';
import {gettext, gettextPlural} from 'core/utils';
import {sdApi} from 'api';

function fetchFromIngest(item: IArticle, destination: ISendToDestinationDesk): Promise<IArticle> {
    return httpRequestJsonLocal<IArticle>({
        method: 'POST',
        path: `/ingest/${item._id}/fetch`,
        payload: {
            desk: destination.desk,
            stage: destination.stage,
        },
    });
}

function fetchFromExternalSource(item: IArticle, destination: ISendToDestinationDesk) {
    return httpRequestJsonLocal<IArticle>({
        method: 'POST',
        path: `/${item.fetch_endpoint}`,
        payload: {
            guid: item.guid,
            desk: destination.desk,
            stage: destination.stage,
        },
        urlParams: {
            repo: item.ingest_provider,
        },
    });
}

interface IImageSizeValidationError {
    name: string;
    width: number;
    height: number;
}

function validateImageSize(items: Array<IArticle>) {
    const validItems: Array<IArticle> = [];
    const invalidItems: Array<IImageSizeValidationError> = [];

    items.forEach((item) => {
        if (appConfig.pictures != null && item.type === 'picture' && item._type === 'ingest') {
            const pictureWidth = item?.renditions.original.width;
            const pictureHeight = item?.renditions.original.height;

            if (appConfig.pictures.minWidth > pictureWidth || appConfig.pictures.minHeight > pictureHeight) {
                invalidItems.push({
                    name: item.headline || item.slugline || 'image',
                    width: item.renditions.original.width,
                    height: item.renditions.original.height,
                });
            } else {
                validItems.push(item);
            }
        } else {
            validItems.push(item);
        }
    });

    return {validItems, invalidItems};
}

function doFetch(validatedItems: Array<IArticle>, selectedDestination: ISendToDestinationDesk) {
    return Promise.all(
        validatedItems.map((item) => {
            if (item.fetch_endpoint != null) {
                return fetchFromExternalSource(item, selectedDestination);
            } else {
                return fetchFromIngest(item, selectedDestination);
            }
        }),
    );
}

export function fetchItems(
    items: Array<IArticle>,
    selectedDestination: ISendToDestinationDesk,
): Promise<Array<IArticle>> {
    return new Promise((resolve, reject) => {
        const {validItems, invalidItems} = validateImageSize(items);

        if (invalidItems.length < 1) {
            doFetch(validItems, selectedDestination).then(resolve);
        } else {
            showModal(({closeModal}) => {
                let actions: Array<IModalSimpleAction> = [
                    {
                        label: gettext('Cancel'),
                        onClick: () => {
                            closeModal();
                            reject();
                        },
                    },
                ];

                if (validItems.length > 0) {
                    actions.push({
                        label: gettext('Fetch valid({{count}})', {count: validItems.length}),
                        onClick: () => doFetch(validItems, selectedDestination).then(resolve),
                    });
                }

                return (
                    <ModalSimple
                        title={gettext('Image size validation failed')}
                        closeModal={closeModal}
                        footerButtons={actions}
                    >
                        <div>
                            {
                                gettextPlural(
                                    invalidItems.length,
                                    '{{n}} images can not be fetched because they are too small.',
                                    'One image can not be fetched because it is too small.',
                                    {n: invalidItems.length},
                                ) + ' ' + gettext(
                                    'Minimum allowed image size is {{minWidth}}x{{minHeight}}',
                                    {
                                        minWidth: appConfig.pictures.minWidth,
                                        minHeight: appConfig.pictures.minHeight,
                                    },
                                )
                            }

                            <h4>{gettext('Items that can not be fetched')}</h4>

                            <table>
                                <thead>
                                    <th>{gettext('file name')}</th>
                                    <th>{gettext('width')}</th>
                                    <th>{gettext('height')}</th>
                                </thead>

                                <tbody>
                                    {
                                        invalidItems.map(({name, width, height}, i) => (
                                            <tr key={i}>
                                                <td>{name}</td>
                                                <td>{width}</td>
                                                <td>{height}</td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </ModalSimple>
                );
            });
        }
    });
}

export function fetchItemsToCurrentDesk(items: Array<IArticle>) {
    const currentDeskId = sdApi.desks.getCurrentDeskId();

    return fetchItems(
        items,
        {
            type: 'desk',
            desk: currentDeskId,
            stage: sdApi.desks.getDeskStages(currentDeskId).find(
                (stage) => stage.default_incoming === true,
            )._id,
        },
    );
}
