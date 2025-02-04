import * as React from 'react';

interface IProps {
    children: React.ReactNode;
}

export class FormItem extends React.PureComponent<IProps> {
    render() {
        return (
            <div className="form__item">
                {this.props.children}
            </div>
        );
    }
}
