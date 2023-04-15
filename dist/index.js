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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@hocuspocus/server");
const client_1 = require("@prisma/client");
const yjs_1 = require("yjs");
const transformer_1 = require("@hocuspocus/transformer");
const starter_kit_1 = __importDefault(require("@tiptap/starter-kit"));
const prisma = new client_1.PrismaClient();
const server = server_1.Server.configure({
    port: 1234,
    debounce: 500,
    onStoreDocument: ({ documentName, document }) => __awaiter(void 0, void 0, void 0, function* () {
        // Extract the task id from the document name
        const taskId = documentName.split(".")[1];
        console.log("Storing task description for task: ", taskId);
        // Store the task description
        yield prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                task_description: transformer_1.TiptapTransformer.fromYdoc(document, "default"),
                updated_at: new Date(),
            },
        });
    }),
    onLoadDocument: ({ documentName }) => __awaiter(void 0, void 0, void 0, function* () {
        // Extract the task id from the document name
        const taskId = documentName.split(".")[1];
        console.log("Loading task: ", taskId);
        // Fetch the task from the database
        const task = yield prisma.task.findUnique({
            where: {
                id: taskId,
            },
        });
        // Return null if the task does not exist
        if (!task) {
            return null;
        }
        return task.task_description !== null
            ? transformer_1.TiptapTransformer.toYdoc(task.task_description, "default", [starter_kit_1.default])
            : new yjs_1.Doc();
    }),
});
server.listen((payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Server is listening on: ", payload.port);
}));
