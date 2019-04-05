import {IDefaultApiFields} from '../types/RestApi';

export interface IKnowledgeBaseItem extends IDefaultApiFields {
    name: string;
    labels?: Array<string>;
    language: string;
    definition_text: string;
    definition_html: string;

    // http://cv.iptc.org/newscodes/cpnature/
    cpnat_type: 'cpnat:abstract' | 'cpnat:event' | 'cpnat:geoArea'
        | 'cpnat:object' | 'cpnat:organisation' | 'cpnat:person' | 'cpnat:poi';
}
