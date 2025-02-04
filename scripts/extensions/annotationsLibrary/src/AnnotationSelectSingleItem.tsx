import * as React from 'react';

import {ISuperdesk} from 'superdesk-api';
import {IKnowledgeBaseItem} from './interfaces';

interface IProps {
    item: IKnowledgeBaseItem;
    annotationTypeSelect: JSX.Element;
    onBack(): void;
    onApplyAnnotation(html: string): void;
    superdesk: ISuperdesk;
}

export class AnnotationSelectSingleItem extends React.Component<IProps> {
    render() {
        const {gettext} = this.props.superdesk.localization;

        return (
            <div>
                <div style={{marginBlockStart: 20}}>
                    {this.props.annotationTypeSelect}
                </div>
                <h3 style={{marginBlockStart: 15}}>{this.props.item.name}</h3>
                <div
                    style={{maxHeight: '15rem', overflow: 'auto', marginBlockStart: 15}}
                    dangerouslySetInnerHTML={{__html: this.props.item.definition_html}}
                />
                <div className="space-between" style={{marginBlockStart: 15}}>
                    <button className="btn btn--primary" onClick={this.props.onBack}>
                        {gettext('Back to results')}
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={() => this.props.onApplyAnnotation(this.props.item.definition_html)}
                    >
                        {gettext('Use this')}
                    </button>
                </div>
            </div>
        );
    }
}
