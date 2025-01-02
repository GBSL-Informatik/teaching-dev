import React from 'react';
import { MDXEditor } from '@mdxeditor/editor'; // Import your MDX editor

class CustomMDXEditor extends React.Component {
    handleChange = (content) => {
        this.props.onChange(content); // Notify CMS of content changes
    };

    render() {
        return <MDXEditor markdown={this.props.value || ''} onChange={this.handleChange} />;
    }
}

export default CustomMDXEditor;
