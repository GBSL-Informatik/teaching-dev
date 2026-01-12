export const DOCUSAURUS_SW_SCOPE =
    process.env.NODE_ENV === 'production' ? ('/assets/js/' as const) : ('/' as const);
