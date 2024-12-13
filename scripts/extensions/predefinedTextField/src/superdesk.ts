import {ISuperdesk} from 'superdesk-api';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const superdesk: ISuperdesk = window['extensionsApiInstances']['predefinedTextField'] as ISuperdesk;
