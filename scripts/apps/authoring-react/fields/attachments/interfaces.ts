import {IAttachment, ICommonFieldConfig} from 'superdesk-api';

export type IAttachmentsValueOperational = Array<{id: IAttachment['_id']}>;
export type IAttachmentsValueStorage = IAttachmentsValueOperational;
export type IAttachmentsUserPreferences = never;
export type IAttachmentsConfig = ICommonFieldConfig;
