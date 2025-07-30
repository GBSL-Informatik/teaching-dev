import { NavbarItem } from '@docusaurus/theme-common';

export const gallery: NavbarItem = {
    to: '/docs/gallery',
    label: 'Galerie',
    position: 'left'
};

export const blog: NavbarItem = { to: '/blog', label: 'Blog', position: 'left' };

export const cms: NavbarItem = {
    to: '/cms',
    label: 'CMS',
    position: 'left'
};

export const gitHub: NavbarItem = {
    href: 'https://github.com/GBSL-Informatik/teaching-dev',
    label: 'GitHub',
    position: 'right'
};

export const taskStateOverview: NavbarItem = {
    type: 'custom-taskStateOverview',
    position: 'left'
};

export const accountSwitcher: NavbarItem = {
    type: 'custom-accountSwitcher',
    position: 'right'
};

export const devModeAccessLocalFS: NavbarItem = {
    type: 'custom-devModeAccessLocalFS',
    position: 'right'
};

export const requestTarget: NavbarItem = {
    type: 'custom-requestTarget',
    position: 'right'
};

export const loginProfileButton: NavbarItem = {
    type: 'custom-loginProfileButton',
    position: 'right'
};

export const personalSpaceOverlay: NavbarItem = {
    type: 'custom-personalSpaceOverlay',
    position: 'right'
};
