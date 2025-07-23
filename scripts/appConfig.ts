import {ISuperdeskGlobalConfig, IExtensions} from 'superdesk-api';

export const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'];

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';
export const extensions: IExtensions = {};

export const userInterfaceLanguage: string = window['user-interface-language'];

/**
 * @deprecated
 * only needed for compatibility with planning
 */
export function getUserInterfaceLanguage() {
    return userInterfaceLanguage;
}

export const debugInfo = {
    translationsLoaded: false,
};

export let authoringReactEnabledUserSelection = (JSON.parse(localStorage.getItem('auth-react') ?? 'false') as boolean);

export function toggleAuthoringReact(enabled: boolean) {
    localStorage.setItem('auth-react', JSON.stringify(enabled));

    authoringReactEnabledUserSelection = enabled;
    return authoringReactEnabledUserSelection;
}
/**
 * Authoring react has to be enabled in the broadcasting
 * module regardless of the user selection.
 * */
export let authoringReactViewEnabled = authoringReactEnabledUserSelection;
export const uiFrameworkAuthoringPanelTest = false;

export function setAuthoringReact(enabled: boolean) {
    authoringReactViewEnabled = enabled;
}
