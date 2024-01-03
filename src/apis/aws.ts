import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
        secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
    },
    region: 'us-east-1',
});

const doc = DynamoDBDocumentClient.from(client);

module.exports = {
    dynamo: {
        delete_item: async input => {
            const command = new DeleteCommand(input);

            return doc.send(command);
        },
        get_item: async input => {
            const command = new GetCommand(input);

            return doc.send(command);
        },
        put_item: async input => {
            const command = new PutCommand(input);

            return doc.send(command);
        },
        update_item: async input => {
            const command = new UpdateCommand(input);

            return doc.send(command);
        },
    },
};
