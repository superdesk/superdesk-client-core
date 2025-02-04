import {sdApi} from 'api';
import React from 'react';

interface IProps {
    value: string;
}

export function adjustHTMLForPreview(html: string): string {
    const parsed: HTMLElement =
    new DOMParser().parseFromString(html, 'text/html').body;

    parsed.querySelectorAll('[data-custom-block-type]').forEach((element) => {
        const customBlockType = element.getAttribute('data-custom-block-type');
        const vocabulary = sdApi.vocabularies.getAll().get(customBlockType);
        const separator = '<div style="border-top: 2px solid lightgray; margin-top: 10px; margin-bottom: 10px;"></div>';

        element.innerHTML = `<div>
            ${separator}

            <div class="mb-1 mt-0-5">
                <span class="label label--translucent">${vocabulary.display_name}</span>
            </div>

            ${element.innerHTML}

            ${separator}
        </div>`;
    });

    return parsed.innerHTML;
}

export class HtmlPreview extends React.Component<IProps> {
    render() {
        const html = this.props.value;

        return (
            <div dangerouslySetInnerHTML={{__html: adjustHTMLForPreview(html)}} />
        );
    }
}
