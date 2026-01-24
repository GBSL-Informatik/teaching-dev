import * as React from 'react';
import { observer } from 'mobx-react-lite';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import Container from './Container';
import Content from './Content';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const Header = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    return (
        <Container code={code}>
            <Content code={code} />
        </Container>
    );
});

export default Header;
