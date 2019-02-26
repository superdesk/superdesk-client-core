import React from "react";
import {IKnowledgeBaseItem} from "apps/knowledge-base/knowledge-base-page";

interface IProps {
    item: IKnowledgeBaseItem;
    onBack(): void;
    onApplyAnnotation(contentPlainText: string): void;
}

export class AnnotationSelectSingleItem extends React.Component<IProps> {
    render() {
        return (
            <div style={{maxHeight: 200, overflow: 'auto'}}>
                <button className="btn btn--primary" onClick={this.props.onBack}>{gettext('Back')}</button>
                <button
                    className="btn btn--primary"
                    onClick={this.props.onApplyAnnotation}
                >
                    {gettext('Use this')}
                </button>
               <p>{this.props.item.definition}</p>
            </div>
        );
    }
}
