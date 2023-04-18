import { Server } from "@hocuspocus/server";
import { PrismaClient } from "@prisma/client";
import { Doc } from "yjs";
import { TiptapTransformer } from "@hocuspocus/transformer";
import StarterKit from "@tiptap/starter-kit";

import type { User } from "@prisma/client";
import type {
  onDisconnectPayload,
  onLoadDocumentPayload,
  onStoreDocumentPayload,
} from "@hocuspocus/server";

// Initialize the Prisma client
const prisma = new PrismaClient();

// Configure the server
const server = Server.configure({
  name: "taskmate-SG-1",
  port: 1234,
  debounce: 500,

  // Callback to handle authentication
  onAuthenticate: async ({ token }) => {
    // Validate the token against the database
    const user = await prisma.user.findUnique({
      where: {
        id: token,
      },
    });

    // Throw an error if the user does not exist
    if (!user) {
      throw new Error("User does not exist, you are not allowed to connect");
    }

    console.log(`User ${user.name} authenticated with ${user.email}`);
    return user;
  },

  // Callback to save the document to DB
  onStoreDocument: async ({
    documentName,
    document,
    context: user,
  }: Omit<onStoreDocumentPayload, "context"> & {
    context: User;
  }) => {
    // Extract the task id from the document name
    const taskId = documentName.split(".")[1];

    // Store the task description
    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        task_description: TiptapTransformer.fromYdoc(document, "default"),
        updated_at: new Date(),
      },
    });

    console.log(
      `Changes to document saved to DB: ${documentName} by ${user.name}`
    );
  },

  // Callback to initialize the document by loading it from DB
  onLoadDocument: async ({
    documentName,
    context: user,
  }: Omit<onLoadDocumentPayload, "context"> & {
    context: User;
  }) => {
    // Extract the task id from the document name
    const documentId = documentName.split(".")[1];

    // Fetch the task from the database
    const task = await prisma.task.findUnique({
      where: {
        id: documentId,
      },
    });

    // Return null if the task does not exist
    if (!task) {
      throw new Error("Document does not exist");
    }

    console.log(`Document loaded from DB: ${documentName} by ${user.name}`);

    return task.task_description !== null
      ? TiptapTransformer.toYdoc(task.task_description, "default", [StarterKit])
      : new Doc();
  },

  // Callback to handle client connection to document
  onConnect: async ({ documentName }) => {
    console.log("Client connecting to document: ", documentName);
  },

  // Callback to handle client disconnection from document
  onDisconnect: async ({
    documentName,
    context: user,
  }: Omit<onDisconnectPayload, "context"> & {
    context: User;
  }) => {
    console.log(
      `Client disconnected from document: ${documentName} by ${user.name}`
    );
  },
});

// Start the server
server.listen(async payload => {
  console.log("Server is listening on: ", payload.port);
});
