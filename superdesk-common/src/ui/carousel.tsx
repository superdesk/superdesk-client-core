import * as React from 'react';
import {Carousel as PRCarousel} from 'primereact/carousel';

interface IState {
    height?: number;
}
type IImage = {src: string, alt?: string};

interface IProps {
    images: Array<IImage>;
}

export class Carousel extends React.PureComponent<IProps, IState> {
    private el?: HTMLDivElement;

    constructor(props: IProps) {
        super(props);

        this.state = {
            height: undefined,
        };
    }

    componentDidMount(): void {
        this.setState({
            height: this.el?.clientHeight,
        });
    }

    render() {
        const imageTemplate = (image: IImage) => {
            return (
                <div
                    className="sd-thumb-carousel__item"
                >
                    <div
                        className="sd-thumb-carousel__item-inner"
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
                        />
                    </div>
                </div>
            );
        };

        return (
            <div
                style={{
                    height: this.state.height,
                }}
                ref={(element) => {
                    this.el = element as HTMLDivElement;
                }}
            >
                <PRCarousel
                    numScroll={1}
                    numVisible={1}
                    orientation="horizontal"
                    indicatorsContentClassName="sd-thumb-carousel__indicators"
                    itemTemplate={imageTemplate}
                    value={this.props.images}
                />
            </div>
        );
    }
}
