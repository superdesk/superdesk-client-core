import * as React from 'react';
import {debounce, isEmpty} from 'lodash';
import {BarIcon} from './BarIcon';
import {ListThumbnails} from './ListThumbnails';
import VideoEditorContext from '../VideoEditorContext';
import {IThumbnail} from '../interfaces';

interface IProps {
    video: React.RefObject<HTMLVideoElement>;
    thumbnails: Array<IThumbnail>;
    trim: {
        start: number;
        end: number;
    };
    onTrim: (start: number, end: number) => void;
}
interface IState {
    currentTime: number;
    thumbnailsRender: Array<IThumbnail>;
    trim: {
        start: number;
        end: number;
    };
}

function getStrTime(secondsTotal: number) {
    let hours: number = Math.floor(secondsTotal / 3600);
    let mins: number = Math.floor((secondsTotal % 3600) / 60);
    let secs: number = Math.floor(secondsTotal % 60);
    let li = Math.floor((secondsTotal * 10) % 10);

    return (
        (hours < 10 ? '0' + hours : hours) +
        ':' +
        (mins < 10 ? '0' + mins : mins) +
        ':' +
        (secs < 10 ? '0' + secs : secs) +
        '.' +
        li
    );
}

export class VideoTimeline extends React.Component<IProps, IState> {
    static contextType = VideoEditorContext;
    declare context: React.ContextType<typeof VideoEditorContext>;
    private controlbar: React.RefObject<HTMLDivElement>;
    private intervalTimer: number;
    private positionX: number;

    constructor(props: IProps) {
        super(props);
        this.state = {
            currentTime: 0,
            thumbnailsRender: [],
            trim: {
                start: this.props.trim.start,
                end: this.props.trim.start,
            },
        };
        this.controlbar = React.createRef();
        this.intervalTimer = 0;
        this.positionX = 0;
        this.handleDrag = debounce(this.handleDrag.bind(this), 5);
        this.handleTimelineClick = this.handleTimelineClick.bind(this);
        this.handledragover = this.handledragover.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.tick = this.tick.bind(this);

        this.handleTimelineClick = this.handleTimelineClick.bind(this);
    }

    componentDidMount() {
        // call tick every 100ms to update current time state
        this.intervalTimer = window.setInterval(this.tick, 100);
        document.addEventListener('dragover', this.handledragover);
        this.setRenderThumbnails();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.thumbnails !== this.props.thumbnails) {
            this.setRenderThumbnails();
        }
        if (
            prevProps.trim !== this.props.trim &&
            this.props.trim.start === 0 &&
            this.props.trim.end === this.props.video.current?.duration
        ) {
            this.updateTrim(0, this.props.trim.end);
        }
    }

    componentWillUnmount() {
        clearInterval(this.intervalTimer);
    }

    updateTrim(start: number, end: number) {
        this.setState({
            trim: {
                start: start,
                end: end,
            },
        });
    }

    handleDrag(type: string) {
        let time = this.getPositionInBar(this.positionX) * this.props.video.current!.duration;

        if (type === 'left') {
            this.updateTrim(time, this.state.trim.end);
        }
        if (type === 'right') {
            this.updateTrim(this.state.trim.start, time);
        }
    }

    handledragover(e: any) {
        if (e.clientX) {
            this.positionX = e.clientX;
        }
    }

    setRenderThumbnails() {
        const thumbnails = this.props.thumbnails;
        // get list thumbnail render in list thumbnails get from server
        const video = this.props.video.current!;
        let widthPic = 0;

        if (isEmpty(thumbnails)) {
            widthPic = video && (50 * video.clientWidth) / video.clientHeight;
        } else {
            widthPic = thumbnails[0].width;
        }
        const numberThumbnails = Math.floor(this.controlbar.current!?.offsetWidth / widthPic);
        const duration = video?.duration ?? 0;
        let thumbnailsRender: Array<IThumbnail> = [];
        const per_delta_image =
            thumbnails.length > 1 ? (thumbnails.length - 1) / numberThumbnails : duration / numberThumbnails;

        for (let i = 0; i <= numberThumbnails; i++) {
            let thumbnail: IThumbnail = {
                url: '',
                width: widthPic,
                height: 50,
            };

            if (this.props.thumbnails && this.props.thumbnails.length > 0) {
                thumbnail = this.props.thumbnails[Math.round(i * per_delta_image)];
                thumbnail.url = thumbnail.url + `?t=${Math.random()}`;
            }
            thumbnailsRender.push(thumbnail);
        }

        this.setState({thumbnailsRender: thumbnailsRender});
    }
    tick() {
        // updates the current time state
        if (this.props.video.current) {
            let currentTime = this.props.video.current!.currentTime;

            if (currentTime <= this.state.trim.end) {
                this.setState({currentTime: currentTime});
            } else if (this.state.trim.end > 0) {
                this.setState({currentTime: this.state.trim.end});
                this.props.video.current!.pause();
            }
        }
    }
    // drag and drop left and right bar.
    handleDragStart(e: React.DragEvent<HTMLDivElement>) {
        // hide drag ghost image
        const img = new Image();

        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(img, 0, 0);
        e.dataTransfer.setData('text/plain', '');
    }

    handleDragEnd() {
        this.setVideoCurrentTime(this.positionX);
        this.props.onTrim(this.state.trim.start, this.state.trim.end);
    }

    // returns a number between 0 and 1
    // e.g. if a video is 60 seconds position 0.25 would represent a position at 15 seconds
    getPositionInBar(pX: number): number {
        const controlbar = this.controlbar.current;

        if (controlbar == null) {
            throw new Error('control bar element is not present');
        }

        var position = (pX - controlbar.getBoundingClientRect().left) / controlbar.offsetWidth;

        if (position > 1) {
            return 1;
        } else if (position < 0) {
            return 0;
        } else {
            return Math.floor(position * 1000) / 1000;
        }
    }

    handleTimelineClick(e: React.MouseEvent) {
        let time = this.setVideoCurrentTime(e.clientX);

        if (time < this.state.trim.start) {
            this.props.onTrim(time, this.state.trim.end);
        }
        if (time > this.state.trim.end) {
            this.props.onTrim(this.state.trim.start, time);
        }
    }

    setVideoCurrentTime(pX: number) {
        let time = this.getPositionInBar(pX) * this.props.video.current!.duration;

        if (time < this.state.trim.start) {
            time = this.state.trim.start;
        }
        if (time > this.state.trim.end) {
            time = this.state.trim.end;
        }
        this.props.video.current!.currentTime = time;
        this.setState({currentTime: time});
        return time;
    }

    render() {
        const {getClass} = this.context.utilities.CSS;
        const video = this.props.video.current!;
        const left = video ? `${(this.state.trim.start / video.duration) * 100}%` : '0%';
        const right = video ? `${(1 - this.state.trim.end / video.duration) * 100}%` : '0%';

        return (
            <div className={getClass('timeline-controls')}>
                <ListThumbnails thumbnails={this.state.thumbnailsRender} getClass={getClass} />
                <div className={`${getClass('controlbars')}`} ref={this.controlbar} onClick={this.handleTimelineClick}>
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--left')}`}
                        style={{
                            width: left,
                        }}
                    />
                    <div
                        className={`${getClass('controlbars__mask')} ${getClass('controlbars__mask--right')}`}
                        style={{
                            width: right,
                        }}
                    />
                    <div
                        className={getClass('controlbars__progress-output')}
                        style={{
                            left: video ? `${(this.state.currentTime / video.duration) * 100}%` : '0%',
                        }}
                    >
                        <div className={getClass('controlbars__progress-output__content')}>
                            <BarIcon />
                            <div className={getClass('controlbars__progress-output__content__inner')}>
                                {getStrTime(this.state.currentTime)}
                            </div>
                        </div>
                        <div className={getClass('controlbars__progress-output__progress-line')} />
                    </div>
                    <div
                        className={`${getClass('controlbars__wrapper-out')}`}
                        style={{
                            left: left,
                            right: right,
                        }}
                    >
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--left')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('left')}
                            onDragEnd={this.handleDragEnd}
                            data-content={getStrTime(this.state.trim.start)}
                        />
                        <div
                            className={`${getClass('controlbars__wrapper')} ${getClass('controlbars__wrapper--right')}`}
                            draggable={true}
                            onDragStart={this.handleDragStart}
                            onDrag={() => this.handleDrag('right')}
                            onDragEnd={this.handleDragEnd}
                            data-content={getStrTime(this.state.trim.end)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
