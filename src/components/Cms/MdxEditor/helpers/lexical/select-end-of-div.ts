export const selectEndOfDiv = (div: HTMLDivElement | null) => {
    if (!div) {
        return;
    }
    const range = document.createRange();
    const selection = window.getSelection();

    // Set range to end of div
    range.selectNodeContents(div);
    range.collapse(false); // false = collapse to end

    // Apply the selection
    selection?.removeAllRanges();
    selection?.addRange(range);

    div.focus();
};
