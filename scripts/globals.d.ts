// ------------------------------------------------------------------------------------------------
// VARIABLES
// ------------------------------------------------------------------------------------------------

declare const __SUPERDESK_CONFIG__: any;

declare const $: any; // jquery
declare const KV: any; // qumu widgets

// angular
declare const angular: IAngularStatic;
declare const inject: any;

// testing
declare const jasmine: any;
declare const spyOn: any;
declare const describe: any;
declare const fdescribe: any;
declare const xdescribe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const expect: any;
declare const it: any;
declare const fit: any;
declare const xit: any;
declare const fail: any;

// Most browsers have it implemented, but the standard's state is still "Editor's Draft".
// https://github.com/Microsoft/TypeScript/issues/28502
declare const ResizeObserver: any;

// globals
// tslint:disable-next-line: interface-name
interface Window {
    instgrm: any;

    // tansa

    tansa: {
        settings: {
            profileId: number;
            platformName?: string;
            platformVersion?: string;
            baseUrl: string;
            parentAppId: string;
            tansaUserId: string;
            licenseKey: string;
            parentAppVersion: string;
            checkboxPreference: boolean;
            clientExtenstionJs: string;
        },
        useDocumentWriteFun: boolean,
    };
    afterProofing: (isCanceled: boolean) => void;
    tansaJQuery: {
        pgwBrowser: () => {
            os: {
                name: string;
                fullVersion: string;
            }
        };
    };

    $: any;
    _paq: any;
    GoogleAnalyticsObject: any;
    ga: any;
    TimeoutHttpInterceptor: any;
    RequestService: any;
    clipboardData: any;
    dragPageY: any;
    gettext: any;
    _: any;
    webkitURL: any;
    superdeskConfig: any;
    module: any;
    RunTansaProofing: any;
    iframely: any;
}

// Allow importing json/html/svg files
declare module "*.json";
declare module "*.html";
declare module "*.svg" {
    const content: string;
    export default content;
}

// ------------------------------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------------------------

type Dictionary<K, V> = {[key: string]: V};
type valueof<T> = T[keyof T];
