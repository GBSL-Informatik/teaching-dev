/** `/` after whitespace, except inside an opening jsx tag, e.g. the `/` of `<Foo />` */
export const QUICK_ACTION_PATTERN = /(?<=^|\s)(?<!<[A-Za-z][^<>]*)\/([^\s/]{0,30})$/;
