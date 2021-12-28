import React from 'react';
import {IArticle, IExtensionActivationResult} from 'superdesk-api';
import {extensions} from 'appConfig';

interface IProps {
    itemOriginal: IArticle;
    itemWithChanges: IArticle;
    coreWidgets?: IExtensionActivationResult['contributions']['authoringTopbarWidgets'];
}

export class AuthoringToolbar extends React.PureComponent<IProps> {
    render() {
        const topbarWidgets = Object.values(extensions)
            .flatMap(({activationResult}) => activationResult?.contributions?.authoringTopbarWidgets ?? [])
            .concat(this.props.coreWidgets);

        const topbarWidgetsStart = topbarWidgets
            .filter(({group}) => group === 'start')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsMiddle = topbarWidgets
            .filter(({group}) => group === 'middle')
            .sort((a, b) => a.priority - b.priority);

        const topbarWidgetsEnd = topbarWidgets
            .filter(({group}) => group === 'end')
            .sort((a, b) => a.priority - b.priority);

        const article = this.props.itemWithChanges;

        const toolbarGroups = [
            topbarWidgetsStart,
            topbarWidgetsMiddle,
            topbarWidgetsEnd,
        ];

        return (
            <div
                style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    gap: 16,
                    alignItems: 'center',
                    paddingLeft: 16,
                    paddingRight: 16,
                }}
            >
                {
                    toolbarGroups.map((items, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {
                                items.map((widget, _i) => {
                                    const Component = widget.component;

                                    return (
                                        <Component
                                            key={_i}
                                            article={article}
                                        />
                                    );
                                })
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}
