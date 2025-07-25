export enum NodeEnv {
    TEST = 'test',
    PRODUCTION = 'prod',
    DEVELOPMENT = 'development',
}

export const BOT_TOKEN = ((process.env.NODE_ENV === NodeEnv.PRODUCTION) ? process.env.BOT_TOKEN_PROD : process.env.BOT_TOKEN_DEV) || '';

export const ADMIN_IDS = (process.env.ADMIN_TELE_IDS) ? process.env.ADMIN_TELE_IDS.split(" ") : [];

export const TMA_LINK = ((process.env.NODE_ENV === NodeEnv.PRODUCTION) ? process.env.TMA_LINK_PROD : process.env.TMA_LINK_TEST) || '';

export const TMA_LINK_DEV = process.env.TMA_LINK_DEV || '';

export const DITTO_GUESS_LINK = process.env.DITTO_GUESS_LINK || '';

export const REDIS_URL = process.env.REDIS_URL || '';

export const WEBHOOK_URL = ((process.env.NODE_ENV === NodeEnv.PRODUCTION) ? process.env.WEBHOOK_URL_PROD : process.env.WEBHOOK_URL_DEV) || '';