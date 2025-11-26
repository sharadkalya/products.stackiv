import { register } from 'tsconfig-paths';

const distDir = __dirname; // when compiled, this will be "<backend>/dist"

register({
    baseUrl: distDir,
    paths: {
        '@/middleware*': ['middleware/*'],
        '@/*': ['*'],
    },
});
