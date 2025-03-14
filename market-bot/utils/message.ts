import { IModify } from '@rocket.chat/apps-engine/definition/accessors';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export async function sendMessage(
	modify: IModify,
	user: IUser,
	room: IRoom,
	message: string,
	imageUrl?: string
): Promise<void> {
	const messageBuilder = modify
		.getCreator()
		.startMessage()
		.setSender(user)
		.setRoom(room)

	if (message) {
		messageBuilder.setBlocks([
			{
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: message,
                }
            },
			// {
            //     type: 'image',
            //     imageUrl: imageUrl,
            //     altText: 'test image'
            // },
		])
	}
	// } else if(message) {
	// 	messageBuilder.setBlocks([
	// 		{
    //             type: 'section',
    //             text: {
    //                 type: 'plain_text',
    //                 text: message,
    //                 emoji: true
    //             }
    //         },
	// 	])
	// }

	await modify.getCreator().finish(messageBuilder);
	return;
}
