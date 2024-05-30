import globals from '/opt/NodeJS/npm-global/lib/node_modules/globals/index.js';

export default [
    {
        files: ['js/*.mjs'],
        rules: {
            semi: 'warn',
            'no-undef': 'error',
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            }
        }
    }
];
