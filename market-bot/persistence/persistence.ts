import { IPersistence, IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";

export class MarketPersistence {
    public static async storeUserWishlist (
        persistence: IPersistence,
        roomId: string,
        userId: string,
        category: string,
        data: any
    ): Promise<boolean> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'user-watchlist'),
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, category)
        ]

        try {
            const dataToStore = {
                ...data,
                roomId,
                userId
            };
            await persistence.createWithAssociations(dataToStore, associations);
            return true;
        } catch (error) {
            console.warn('Failed to store user-watch data ', error);
            return false;
        }
    }

    // public static async storeUserForexWishlist (
    //     persistence: IPersistence,
    //     roomId: string,
    //     userId: string,
    //     category: string,
    //     data: any
    // ): Promise<boolean> {
    //     const associations: Array<RocketChatAssociationRecord> = [
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'user-watchlist'),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, category)
    //     ]

    //     try {
    //         const dataToStore = {
    //             ...data,
    //             roomId,
    //             userId
    //         };
    //         await persistence.createWithAssociations(dataToStore, associations);
    //         return true;
    //     } catch (error) {
    //         console.warn('Failed to store user-watch data ', error);
    //         return false;
    //     }
    // }

    // public static async storeUserCryptoWishlist (
    //     persistence: IPersistence,
    //     roomId: string,
    //     userId: string,
    //     category: string,
    //     data: any
    // ): Promise<boolean> {
    //     const associations: Array<RocketChatAssociationRecord> = [
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'user-watchlist'),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
    //         new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, category)
    //     ]

    //     try {
    //         const dataToStore = {
    //             ...data,
    //             roomId,
    //             userId
    //         };
    //         await persistence.createWithAssociations(dataToStore, associations);
    //         return true;
    //     } catch (error) {
    //         console.warn('Failed to store user-watch data ', error);
    //         return false;
    //     }
    // }

    public static async getAllUserWatchList(persistence: IPersistenceRead): Promise<Array<any>> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'user-watchlist'),
        ];

        try {
            return await persistence.readByAssociations(associations);
        } catch (err) {
            console.warn('Failed to retrieve user-watch data:', err);
            return [];
        }
    }

    public static async deleteAllUserWatchlist(persistence: IPersistence): Promise<boolean>  {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'user-watchlist'),
        ]

        try {
            await persistence.removeByAssociations(associations)
        } catch (error) {
            console.warn(error)
            return false
        }
        return true
    }

    public static async getUserWatchListByCategory(category: string, persistence: IPersistenceRead, roomId: string, userId: string): Promise<Array<any>> {
        const associations: Array<RocketChatAssociationRecord> = [
            new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.USER, userId),
            new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, category)
        ]

        try {
            return await persistence.readByAssociations(associations)
        } catch (error) {
            console.warn('Failed to retrieve user-watch data', error)
            return []
        }
    }
}