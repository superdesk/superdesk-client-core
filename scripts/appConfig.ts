import {ISuperdeskGlobalConfig, IExtensions} from 'superdesk-api';

const appConfigForUnitTests = __SUPERDESK_CONFIG__;
const userInterfaceLanguageForUnitTests = 'en';

export const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'] ?? appConfigForUnitTests;
export const userInterfaceLanguage: string = window['user-interface-language'] ?? userInterfaceLanguageForUnitTests;

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';
export const extensions: IExtensions = {};

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
