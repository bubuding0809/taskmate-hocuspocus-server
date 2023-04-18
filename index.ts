import { Server } from "@hocuspocus/server";
import { PrismaClient } from "@prisma/client";
import { Doc } from "yjs";
import { TiptapTransformer } from "@hocuspocus/transformer";
import StarterKit from "@tiptap/starter-kit";

const prisma = new PrismaClient();

const server = Server.configure({
  // Make the server available over https
  port: 1234,
  debounce: 500,

  // Callback to handle authentication
  onAuthenticate: async ({ token }) => {
    console.log("Authenticating user: ", token);

    // Validate the token
    const user = await prisma.user.findUnique({
      where: {
        id: token,
      },
    });

    // Return null if the user does not exist
    if (!user) {
      throw new Error("User does not exist, you are not allowed to connect");
    }

    // Return the user object
    return user;
  },

  // Callback to save the document to DB
  onStoreDocument: async ({ documentName, document, context }) => {
    console.log(context);

    // Extract the task id from the document name
    const taskId = documentName.split(".")[1];

    console.log("Storing task description for task: ", taskId);
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
  },

  // Callback to initialize the document by loading it from DB
  onLoadDocument: async ({ documentName, context }) => {
    console.log(context);
    // Extract the task id from the document name
    const taskId = documentName.split(".")[1];

    console.log("Loading task: ", taskId);
    // Fetch the task from the database
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    // Return null if the task does not exist
    if (!task) {
      return null;
    }

    return task.task_description !== null
      ? TiptapTransformer.toYdoc(task.task_description, "default", [StarterKit])
      : new Doc();
  },

  // Callback to handle client connection to document
  onConnect: async ({ documentName, connection }) => {
    console.log("Client connected to document: ", documentName);
  },

  // Callback to handle client disconnection from document
  onDisconnect: async ({ documentName, context }) => {
    console.log(context);
    console.log("Client disconnected from document: ", documentName);
  },
});

server.listen(async payload => {
  console.log("Server is listening on: ", payload.port);
});
