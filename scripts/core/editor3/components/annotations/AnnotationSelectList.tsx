import React from "react";
import {IKnowledgeBaseItem} from "apps/knowledge-base/knowledge-base-page";
import {Item, Column, Row} from "core/ui/components/List";

interface IProps {
    onSelect(item: IKnowledgeBaseItem): void;
    items: Array<IKnowledgeBaseItem>;
}

export class AnnotationSelectList extends React.Component<IProps> {
    render() {
        return (
            <div style={{maxHeight: 200, overflow: 'auto'}}>
                {this.props.items.map((item) => (
                    <Item onClick={() => this.props.onSelect(item)}>
                        <Column grow>
                            <Row><strong>{item.name}</strong></Row>
                            <Row>
                                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                    {item.definition}
                                </span>
                            </Row>
                        </Column>
                    </Item>
                ))}
            </div>
        );
    }
}
