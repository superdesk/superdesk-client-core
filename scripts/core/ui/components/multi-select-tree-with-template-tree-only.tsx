import React from 'react';
import {ITreeNode} from 'superdesk-api';

interface IProps<T> {
    options: Array<ITreeNode<T>>;
    values: Array<T>;
    onChange(values: Array<T>): void;
    optionTemplate: React.ComponentType<{item: T}>;
}

interface IState<T> {
    currentNode: ITreeNode<T> | null;
}

export class MultiSelectTemplate<T> extends React.PureComponent<IProps<T>, IState<T>> {
    constructor(props: IProps<T>) {
        super(props);

        const node1 = {value: null, children: []};
        const children = props.options.map((opt) => ({...opt, parent: node1}));

        node1.children = children;

        this.state = {
            currentNode: node1,
        };
    }

    render() {
        const options = this.state.currentNode?.children ?? this.props.options;
        const OptionTemplate = this.props.optionTemplate;
        const {values, onChange} = this.props;

        return (
            <div style={{background: 'white', padding: 10, border: '1px solid red'}}>
                {
                    this.state.currentNode?.parent != null && (
                        <button
                            onClick={() => {
                                this.setState({currentNode: this.state.currentNode.parent});
                            }}
                        >
                            &lt;
                        </button>
                    )
                }

                {
                    options.map((item, i) => (
                        <div key={i}>
                            <button
                                onClick={() => {
                                    onChange(values.concat(item.value));
                                }}
                            >
                                <OptionTemplate item={item.value} />
                            </button>

                            {
                                item.children?.length > 0 && (
                                    <button
                                        onClick={() => {
                                            this.setState({currentNode: item});
                                        }}
                                    >
                                        &gt;
                                    </button>
                                )
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}
