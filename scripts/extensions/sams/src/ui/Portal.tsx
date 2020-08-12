import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface IProps {
    id: string;
    children: React.ReactNode;
}

export class Portal extends React.Component<IProps, any> {
    parentElement: Element;

    constructor(props: IProps) {
        super(props);
        this.parentElement = document.createElement('div');
        this.parentElement.setAttribute('data-portal-id', this.props.id);
    }

    componentDidMount() {
        document.body.appendChild(this.parentElement);
    }

    componentWillUnmount() {
        document.body.removeChild(this.parentElement);
    }

    render() {
        return ReactDOM.createPortal(
            this.props.children,
            this.parentElement,
        );
    }
}
