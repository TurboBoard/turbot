"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({
    credentials: {
        accessKeyId: process.env.AMAZON_ACCESS_KEY_ID,
        secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY,
    },
    region: 'us-east-1',
});
const doc = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
module.exports = {
    dynamo: {
        delete_item: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const command = new lib_dynamodb_1.DeleteCommand(input);
            return doc.send(command);
        }),
        put_item: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const command = new lib_dynamodb_1.PutCommand(input);
            return doc.send(command);
        }),
        update_item: (input) => __awaiter(void 0, void 0, void 0, function* () {
            const command = new lib_dynamodb_1.UpdateCommand(input);
            return doc.send(command);
        }),
    },
};
//# sourceMappingURL=aws.js.map