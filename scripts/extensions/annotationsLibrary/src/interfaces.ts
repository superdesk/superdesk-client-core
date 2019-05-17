import {IBaseRestApiResponse} from "superdesk-api";

export interface IKnowledgeBaseItem extends IBaseRestApiResponse {
    name: string;
    labels?: Array<string>;
    language: string;
    definition_text: string;
    definition_html: string;

    // http://cv.iptc.org/newscodes/cpnature/
    cpnat_type: 'cpnat:abstract' | 'cpnat:event' | 'cpnat:geoArea'
        | 'cpnat:object' | 'cpnat:organisation' | 'cpnat:person' | 'cpnat:poi';
}
