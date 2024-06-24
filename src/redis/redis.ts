import { RedisClientType, RedisFunctions, RedisModules, RedisScripts, createClient } from "redis";
import { REDIS_URL } from "../utils/config";
import { logger } from "../utils/logger";

// Redis
export const redisClient = createClient({
    url: REDIS_URL
})
redisClient.on('error', (err) => console.error(`Redis Client Error ${err}`))
redisClient.connect().then(() => {
    logger.info('Connected to Redis')
})

process.on('SIGINT', () => gracefulShutdown(redisClient));
process.on('SIGTERM', () => gracefulShutdown(redisClient));

async function gracefulShutdown(
    redisClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
) {
    logger.info(`Quitting redis client.`);
    redisClient.quit();
}