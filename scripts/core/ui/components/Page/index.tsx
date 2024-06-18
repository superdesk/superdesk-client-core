import * as React from 'react';

export class Page extends React.PureComponent<{title: string}> {
    render() {
        const {title, children} = this.props;

        return (
            <div className="sd-page">
                <section className="sd-page__main-content">
                    <div className="sd-page__header sd-page__header--white">
                        <h2 className="sd-page__page-heading">{title}</h2>
                    </div>
                    <div className="sd-page__flex-helper" style={{overflowY: 'auto'}}>
                        {children}
                    </div>
                </section>
            </div>
        );
    }
}
