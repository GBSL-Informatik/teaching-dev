import DefaultNavbarItem from '@theme/NavbarItem/DefaultNavbarItem';
import DocNavbarItem from '@theme/NavbarItem/DocNavbarItem';
import DocSidebarNavbarItem from '@theme/NavbarItem/DocSidebarNavbarItem';
import DocsVersionDropdownNavbarItem from '@theme/NavbarItem/DocsVersionDropdownNavbarItem';
import DocsVersionNavbarItem from '@theme/NavbarItem/DocsVersionNavbarItem';
import DropdownNavbarItem from '@theme/NavbarItem/DropdownNavbarItem';
import HtmlNavbarItem from '@theme/NavbarItem/HtmlNavbarItem';
import LocaleDropdownNavbarItem from '@theme/NavbarItem/LocaleDropdownNavbarItem';
import SearchNavbarItem from '@theme/NavbarItem/SearchNavbarItem';

import EditingOverview from '@tdev-components/EditingOverview';
import AccountSwitcher from '@tdev-components/Navbar/AccountSwitcher';
import DevModeAccessLocalFS from '@tdev-components/Navbar/DevModeAccessLocalFS';
import LoginProfileButton from '@tdev-components/Navbar/LoginProfileButton';
import PersonalSpaceOverlay from '@tdev-components/Navbar/PersonalSpaceOverlay';
import RequestTarget from '@tdev-components/Navbar/RequestTarget';
import type { ComponentTypesObject } from '@theme/NavbarItem/ComponentTypes';

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
    ['custom-devModeAccessLocalFS']: DevModeAccessLocalFS,
    ['custom-loginProfileButton']: LoginProfileButton,
    ['custom-taskStateOverview']: EditingOverview,
    ['custom-requestTarget']: RequestTarget,
    ['custom-personalSpaceOverlay']: PersonalSpaceOverlay
};

export default ComponentTypes;
