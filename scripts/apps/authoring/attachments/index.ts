
import {IMedia} from 'superdesk-interfaces/Media';

export {attachments} from './reducer';
export {initAttachments} from './actions';

export interface IAttachment {
    _id: string;
    title: string;
    mimetype: string;
    filename: string;
    description: string;
    media: IMedia;
}
