export interface ITagUi {
    name: string;
    description?: string;
    qcode: string;
    source?: string;
    original_source?: string;
    aliases?: Array<string>;
    altids: {[key: string]: string};
    parent?: string;
    /** The identifier of a controlled vocabulary which includes a code for the tag. */
    scheme?: string;
    group: {kind: 'scheme' | 'visual'; value: string};
}
