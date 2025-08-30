import React from 'react';
import * as Mdi from '@mdi/js';
import _ from 'es-toolkit/compat';
import Select from 'react-select';

const DropdownSelector = (): React.ReactNode => {
    const options = React.useMemo(
        () => Object.keys(Mdi).map((i) => ({ value: i, label: <span>{i}</span> })),
        []
    );
    return (
        <div>
            <Select isSearchable options={options} />
        </div>
    );
};

export default DropdownSelector;
