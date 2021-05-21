export interface ITagUi {
    name: string;
    description?: string;
    qcode: string;
    source?: string;
    original_source?: string;
    aliases?: Array<string>;
    altids: {[key: string]: string};
    group: {kind: 'scheme' | 'visual'; value: string};
}
