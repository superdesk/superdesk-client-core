export interface ITagUi {
    name: string;
    description?: string;
    qcode: string;
    source?: string;
    altids: {[key: string]: string};
    group: {kind: 'scheme' | 'visual'; value: string};
}
