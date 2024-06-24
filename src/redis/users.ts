import { RedisClientType, RedisFunctions, RedisModules, RedisScripts } from "redis";
import { redisClient } from "./redis";

export interface UserData {
    walletAddress: string;
    username: string;
    firstName: string;
}

export async function userExistsInRedis(
    userId: number
): Promise<boolean> {
    const exists = await redisClient.exists(`user:${userId}`);
    return exists === 1;
}

export async function addUserToRedis(
    userId: number,
    username: string,
    firstName: string
) {
    if (await userExistsInRedis(userId)) {
        await redisClient.hSet(`user:${userId}`, {
            username,
            firstName
        });
    } else {
        await redisClient.hSet(`user:${userId}`, {
            walletAddress: '',
            username,
            firstName
        });
    
        await redisClient.sAdd('userIds', userId.toString());
    }
}

export async function updateWalletAddressInRedis(
    userId: number,
    walletAddress: string
) {
    const userExists = await redisClient.exists(`user:${userId}`);
    if (userExists) {
        await redisClient.hSet(`user:${userId}`, 'walletAddress', walletAddress);
    } else {
        throw new Error('User not found');
    }
}

export async function getAllUserIdsFromRedis(
): Promise<string[]> {
    const userIds = await redisClient.sMembers('userIds');
    return userIds;
}

export async function getUserByIdFromRedis(
    userId: number
): Promise<UserData> {
    const userData = await redisClient.hGetAll(`user:${userId}`);
    if (Object.keys(userData).length === 0) {
        throw new Error('User id not found');
    }
    return {
        walletAddress: userData.walletAddress,
        username: userData.username,
        firstName: userData.firstName
    };
}
