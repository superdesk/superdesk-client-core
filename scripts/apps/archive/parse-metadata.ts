import {parseMetadata} from '@uswriting/exiftool/cjs';
import {IContentProfileType} from 'apps/workspace/content/controllers/ContentProfilesController';
import {IPTCMetadata} from 'superdesk-api';
import {getObjectEntries} from 'utils/object';
import {EXIFTOOL_ARGS, XMP_IPTC_TAGS} from './constants';
import zeroperl from '../../binaries/zeroperl-1.0.1.wasm';

type RawMetadata = {
  data: Array<Record<string, unknown>>;
  contentType: IContentProfileType.picture | IContentProfileType.video;
};

type ExiftoolOptions = Parameters<typeof parseMetadata>[1];

/**
 * return bundled wasm binary if any issues occur in the exiftool lib fetching the wasm binary
 */
export const fetchZeroperl = () => fetch(zeroperl);

const getMetadata = (() => {
    let retryCount = 0;
    const maxRetries = 3;

    return (f: File, options?: ExiftoolOptions) => {
        const getMetadataFn = f.type.startsWith('video/')
            ? getVideoMetadata
            : getPictureMetadata;
        const getMetadataFnOptions = retryCount >= maxRetries
            ? {...options, fetch: fetchZeroperl}
            : options;

        return getMetadataFn(f, getMetadataFnOptions)
            .catch((err) => {
                console.error(err);
                retryCount++;
                return getMetadataFn(f, {...options, fetch: fetchZeroperl});
            })
            .then(processMetadata)
            .catch((): Partial<IPTCMetadata> => ({}));
    };
})();


const getVideoMetadata = (
    f: File,
    options?: ExiftoolOptions,
): Promise<RawMetadata> =>
    parseMetadata<any>(f, {
        args: [EXIFTOOL_ARGS.showGroupNames, EXIFTOOL_ARGS.JSON, EXIFTOOL_ARGS.XMP],
        transform: (d) => JSON.parse(d),
        ...options,
    }).then((r) => ({...r, contentType: IContentProfileType.video}));

const getPictureMetadata = (
    f: File,
    options?: ExiftoolOptions,
): Promise<RawMetadata> =>
    parseMetadata<any>(f, {
        args: [
            EXIFTOOL_ARGS.showGroupNames,
            EXIFTOOL_ARGS.JSON,
            EXIFTOOL_ARGS.XMP,
            EXIFTOOL_ARGS.showDuplicates,
            EXIFTOOL_ARGS.IPTC,
            ...EXIFTOOL_ARGS.COMPOSITE,
        ],
        transform: (d) => JSON.parse(d),
        ...options,
    }).then((r) => ({...r, contentType: IContentProfileType.picture}));

const processMetadata = (metadata: RawMetadata): Partial<IPTCMetadata> => {
    let data = metadata.data?.[0] ?? {};

    data = extractLangAltValues(data);

    if (metadata.contentType === IContentProfileType.video)
        return stripGroupNames(mapXMPtoIPTC(data));
    return stripGroupNames(data);
};

const mapXMPtoIPTC = (metadata: RawMetadata['data'][number]) =>
    getObjectEntries(metadata).reduce<RawMetadata['data'][number]>(
        (acc, [k, v]) => {
            acc[XMP_IPTC_TAGS[k] ?? k] = v;
            return acc;
        },
        {},
    );

const stripGroupNames = (metadata: RawMetadata['data'][number]) =>
    (({IPTC, XMP, Composite}) => ({...IPTC, ...XMP, ...Composite}))(
        getObjectEntries(metadata).reduce<
      Record<string, Partial<Record<string, unknown>>>
    >(
        (a, [k, v]) => {
            const [group, tag] = k.split(':');

            if (!group || !tag) return a;
            a[group][tag] = v;
            return a;
        },
        {IPTC: {}, XMP: {}, Composite: {}},
    ),
    );


/**
 * -j arg should remove outer lang-alt tag but output still contains the outer tag
 * so this function manually removes them by getting the inner text content
 */
const extractLangAltValues = (data: Record<string, unknown>) : Record<string, unknown> => {
    const extracted = {};
    const parser = new DOMParser();

    for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'string') {
            extracted[key] = value;
            continue;
        }

        const doc = parser.parseFromString(value, 'text/html');

        extracted[key] = doc.body.textContent?.trim() ?? '';
    }
    return extracted;
};

export {getMetadata, getPictureMetadata, getVideoMetadata};
