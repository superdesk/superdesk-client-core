import {ISuperdesk} from 'superdesk-api';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const superdesk: ISuperdesk = window['extensionsApiInstances']['ai-widget'] as ISuperdesk;
