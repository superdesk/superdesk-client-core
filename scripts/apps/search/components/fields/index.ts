import React from 'react';
import {IPropsItemListInfo} from '../ListItemInfo';

import {type} from './type';
import {headline} from './headline';
import {slugline} from './slugline';
import {wordcount} from './wordcount';
import {highlights} from './highlights';
import {markedDesks} from './markedDesks';
import {versioncreated} from './versioncreated';
import {versioncreator} from './versioncreator';
import {profile} from './profile';
import {state} from './state';
import {scheduledDateTime} from './scheduledDateTime';
import {embargo} from './embargo';
import {update} from './update';
import {updated} from './updated';
import {takekey} from './takekey';
import {signal} from './signal';
import {broadcast} from './broadcast';
import {flags} from './flags';
import {category} from './category';
import {provider} from './provider';
import {expiry} from './expiry';
import {desk} from './desk';
import {fetchedDesk} from './fetchedDesk';
import {priority} from './priority';
import {urgency} from './urgency';
import {associations} from './associations';
import {queueError} from './queueError';
import {assignment} from './assignment';
import {language} from './language';
import {copyright} from './copyright';
import {usageterms} from './usageterms';
import {nestedlink} from './nested-link';
import {associatedItems} from './associatedItems';
import {Translations} from './translations';
import {Used} from './used';
import {LinesCount} from './linesCount';
import {Authors} from './authors';
import {IArticle} from 'superdesk-api';

interface IFieldProps extends Partial<IPropsItemListInfo> {
    item: IPropsItemListInfo['item']; // this one not nullable
}

export type IRelatedEntitiesToFetch = Array<{endpoint: string; id: string}>;

interface IReactFieldComponentClass<P> extends React.ComponentClass<P> {
    getRelatedEntities?(item: IArticle): IRelatedEntitiesToFetch;
}

export const fields: {[key: string]: IReactFieldComponentClass<IFieldProps>} = {
    type,
    headline,
    slugline,
    wordcount,
    linesCount: LinesCount,
    highlights,
    markedDesks,
    versioncreated,
    versioncreator,
    profile,
    state,
    scheduledDateTime,
    embargo,
    update,
    updated,
    takekey,
    signal,
    broadcast,
    flags,
    category,
    provider,
    expiry,
    desk,
    fetchedDesk,
    priority,
    urgency,
    associations,
    queueError,
    assignment,
    language,
    copyright,
    usageterms,
    nestedlink,
    associatedItems,
    translations: Translations,
    used: Used,
    authors: Authors,
};
