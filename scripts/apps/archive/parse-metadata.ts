import {parseMetadata} from '@uswriting/exiftool/cjs';
import {IContentProfileType} from 'apps/workspace/content/controllers/ContentProfilesController';
import {IPTCMetadata} from 'superdesk-api';
import {getObjectEntries} from 'utils/object';
import {EXIFTOOL_ARGS, XMP_IPTC_TAGS} from './constants';

type RawMetadata = {
  data: Array<Record<string, unknown>>;
  contentType: IContentProfileType.picture | IContentProfileType.video;
};

type ExiftoolOptions = Parameters<typeof parseMetadata>[1];

const getMetadata = (f: File, options?: ExiftoolOptions) =>
    (f.type.startsWith('video/')
        ? getVideoMetadata(f, options)
        : getPictureMetadata(f, options)
    ).then(processMetadata, (): Partial<IPTCMetadata> => ({}));

const getVideoMetadata = (
    f: File,
    options?: ExiftoolOptions,
): Promise<RawMetadata> =>
    parseMetadata(f, {
        args: [EXIFTOOL_ARGS.showGroupNames, EXIFTOOL_ARGS.JSON, EXIFTOOL_ARGS.XMP],
        transform: (d) => JSON.parse(d),
        ...options,
    }).then((r) => ({...r, contentType: IContentProfileType.video}));

const getPictureMetadata = (
    f: File,
    options?: ExiftoolOptions,
): Promise<RawMetadata> =>
    parseMetadata(f, {
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
    const data = metadata.data[0] ?? {};

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

export {getMetadata, getPictureMetadata, getVideoMetadata};
