import { GenericValue as GenericValueType } from '@tdev-components/shared/JsObject/toJsSchema';
import GenericValue from '@tdev-components/shared/JsObject/Viewer/GenericField/GenericValue';
import JsType from '@tdev-components/shared/JsObject/Viewer/JsType';
import { observer } from 'mobx-react-lite';

export interface Props {
    js: GenericValueType;
    className?: string;
}

const GenericField = observer((props: Props) => {
    const { js } = props;

    if (js.name === undefined) {
        return <GenericValue {...props} js={js} />;
    }

    return (
        <JsType js={js}>
            <GenericValue {...props} js={js} />
        </JsType>
    );
});

export default GenericField;
