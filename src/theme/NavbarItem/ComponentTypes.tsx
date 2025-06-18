import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import SearchNavbarItem from '@theme/NavbarItem/SearchNavbarItem';
import HtmlNavbarItem from '@theme/NavbarItem/HtmlNavbarItem';
import DocNavbarItem from '@theme/NavbarItem/DocNavbarItem';
import DocSidebarNavbarItem from '@theme/NavbarItem/DocSidebarNavbarItem';
import DocsVersionNavbarItem from '@theme/NavbarItem/DocsVersionNavbarItem';
import DocsVersionDropdownNavbarItem from '@theme/NavbarItem/DocsVersionDropdownNavbarItem';

import type { ComponentTypesObject } from '@theme/NavbarItem/ComponentTypes';
import LoginProfileButton from '@tdev-components/Navbar/LoginProfileButton';
import AccountSwitcher from '@tdev-components/Navbar/AccountSwitcher';
import EditingOverview from '@tdev-components/EditingOverview';
import RequestTarget from '@tdev-components/Navbar/RequestTarget';
import PersonalSpaceOverlay from '@tdev-components/Navbar/PersonalSpaceOverlay';

const ComponentTypes: ComponentTypesObject = {
    default: DefaultNavbarItem,
    localeDropdown: LocaleDropdownNavbarItem,
    search: SearchNavbarItem,
    dropdown: DropdownNavbarItem,
    html: HtmlNavbarItem,
    doc: DocNavbarItem,
    docSidebar: DocSidebarNavbarItem,
    docsVersion: DocsVersionNavbarItem,
    docsVersionDropdown: DocsVersionDropdownNavbarItem,
    ['custom-accountSwitcher']: AccountSwitcher,
    ['custom-loginProfileButton']: LoginProfileButton,
    ['custom-taskStateOverview']: EditingOverview,
    ['custom-requestTarget']: RequestTarget,
    ['custom-personalSpaceOverlay']: PersonalSpaceOverlay
};

export default ComponentTypes;
