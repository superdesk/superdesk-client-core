import * as React from 'react';
import {IKnowledgeBaseItem} from './interfaces';
import {ISuperdesk} from "superdesk-api";

interface IProps {
    onSelect(item: IKnowledgeBaseItem): void;
    onCancel(): void;
    backButton: JSX.Element;
    items: Array<IKnowledgeBaseItem>;
    superdesk: ISuperdesk;
}

export class AnnotationSelectList extends React.Component<IProps> {
    render() {
        const {UserHtmlSingleLine} = this.props.superdesk.components;
        const {Item, Column, Row} = this.props.superdesk.components.List;

        return (
            <div>
                <div style={{maxHeight: '20rem', overflow: 'auto', paddingTop: 15}}>
                    {this.props.items.map((item, i) => (
                        <Item key={i} onClick={() => this.props.onSelect(item)}>
                            <Column grow>
                                <Row><strong>{item.name}</strong></Row>
                                <Row>
                                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                        <UserHtmlSingleLine html={item.definition_html} />
                                    </span>
                                </Row>
                            </Column>
                        </Item>
                    ))}
                </div>
                {this.props.backButton}
            </div>
        );
    }
}
