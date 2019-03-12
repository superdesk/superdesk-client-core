// ------------------------------------------------------------------------------------------------
// VARIABLES
// ------------------------------------------------------------------------------------------------

declare const __SUPERDESK_CONFIG__: any;

declare const $: any; // jquery
declare const gettext: any;
declare const KV: any; // qumu widgets

// angular
declare const angular: any;
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

// globals
// tslint:disable-next-line: interface-name
interface Window {
    instgrm: any;
    tansa: any;
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

// Allow importing json/html files
declare module "*.json";
declare module "*.html";

// ------------------------------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------------------------

type Dictionary<K, V> = {};
type Omit<K, V> = Pick<K, Exclude<keyof K, V>>;
