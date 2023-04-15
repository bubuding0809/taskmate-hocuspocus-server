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
  onStoreDocument: async ({ documentName, document }) => {
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
  onLoadDocument: async ({ documentName }) => {
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
});

server.listen(async payload => {
  console.log("Server is listening on: ", payload.port);
});
