import React from 'react';
import {IArticle} from 'superdesk-api';
import ng from 'core/services/ng';
import {Button} from 'superdesk-ui-framework';
import {gettext} from 'core/utils';

// TODO: how to get item by ID

interface IProps {
    itemId: IArticle['_id'];
}

interface IState {
    cssOpeningAnimationCompleted: boolean;
}

export class AuthoringReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            cssOpeningAnimationCompleted: false,
        };
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({cssOpeningAnimationCompleted: true});
        }, 500);
    }

    render() {
        if (this.state.cssOpeningAnimationCompleted !== true) {
            return null;
        }

        return (
            <div className="sd-authoring-react">
                <div>hello world</div>

                <br />

                <Button
                    text={gettext('Close')}
                    onClick={() => {
                        ng.get('authoringWorkspace').close();
                        ng.get('$rootScope').$applyAsync();
                    }}
                />

            </div>
        );
    }
}
