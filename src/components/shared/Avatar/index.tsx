import React from 'react';
import clsx from 'clsx';

interface Props {
    imgSrc: string;
    name: React.ReactNode;
    description?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    alt?: string;
    href?: string;
    vertical?: boolean;
    className?: string;
}

const Avatar = (props: Props) => {
    return (
        <div className={clsx('avatar', props.className, props.vertical && 'avatar--vertical')}>
            {props.href ? (
                <a
                    className={clsx(
                        'avatar__photo-link',
                        'avatar__photo',
                        props.size && `avatar__photo--${props.size}`
                    )}
                    href={props.href}
                    target="_blank"
                >
                    <img src={props.imgSrc} alt={props.alt} />
                </a>
            ) : (
                <img
                    className={clsx(
                        'avatar__photo',
                        props.size && `avatar__photo--${props.size}`,
                        props.href && 'avatar__photo--link'
                    )}
                    src={props.imgSrc}
                    alt={props.alt}
                />
            )}
            <div className={clsx('avatar__intro')}>
                <div className={clsx('avatar__name')}>{props.name}</div>
                {props.description && <small className={clsx('avatar__subtitle')}>{props.description}</small>}
            </div>
        </div>
    );
};

export default Avatar;
