import * as React from 'react';
import {IArticle, ISuperdesk} from 'superdesk-api';

interface IProps {
    article: IArticle;
}

export function getAutoTaggingComponent(_: ISuperdesk, label: string) {
    return class AutoTagging extends React.PureComponent<IProps> {
        render() {
            return (
                <div>
                    <div>
                        <span>{label}</span>
                        <button
                            onClick={() => {
                                console.log('test');
                            }}
                        >
                            +
                        </button>
                    </div>
                </div>
            );
        }
    };
}
