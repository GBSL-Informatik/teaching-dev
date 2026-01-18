import * as React from 'react';
import { observer } from 'mobx-react-lite';
import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import Container from './Container';
import Content from './Content';

interface Props<T extends CodeType> {
    script: iCode<T>;
}

const Header = observer(<T extends CodeType>(props: Props<T>) => {
    const { script } = props;
    return (
        <Container script={script}>
            <Content script={script} />
        </Container>
    );
});

export default Header;
