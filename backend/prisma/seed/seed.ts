import { createChat } from "@/db/chat";
import { createChatMember } from "@/db/chatMember";
import { createMessage } from "@/db/message";
import { createUser } from "@/db/user";
import { EncryptedMessage } from "@common";
import testData from "./testData.json";
import prisma from "@/db/_db";
import { Chat, ChatMember, Message, User } from "@prisma/client";
import { readFile } from "fs/promises";
import { createImage } from "@/db/image";

async function readImg(path: string) {
  return await readFile(path);
}

async function encryptText(
  key: CryptoKey,
  text: string
): Promise<EncryptedMessage> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(text)
  );

  return {
    data: new Uint8Array(encrypted),
    iv,
  };
}

async function createUserMasterKey(chatKey: CryptoKey, username: string) {
  const encoder = new TextEncoder();
  const encodedUserName = encoder.encode(username);

  const hash = await crypto.subtle.digest("SHA-256", encodedUserName);

  const key = await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-KW" },
    true,
    ["wrapKey", "unwrapKey"]
  );

  const wrappedKey = await crypto.subtle.wrapKey("raw", chatKey, key, {
    name: "AES-KW",
  });

  return new Uint8Array(wrappedKey);
}

async function seedDatabase(): Promise<{
  users: (User & { passwordNotHashed: string })[];
  chats: Chat[];
  chatMembers: ChatMember[];
  messages: Message[];
}> {
  await prisma.user.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.image.deleteMany();

  const pfpImgData = await readImg("./prisma/seed/img/pfp.png");
  const dbpfpImage = await createImage(pfpImgData, "png", "pfpImg");
  if (!dbpfpImage) {
    throw Error("Failed to create image");
  }

  const groupImgData = await readImg("./prisma/seed/img/group.png");
  const dbgroupImage = await createImage(groupImgData, "png", "groupImg");

  if (!dbgroupImage) {
    throw Error("Failed to create image");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );

  const users = await Promise.all(
    testData.users.map(async (u) => {
      return {
        ...(await createUser(
          u.username,
          u.password,
          u.mfaEnabled || false,
          dbpfpImage.id
        ))!,
        passwordNotHashed: u.password,
      };
    })
  );

  const chats = await Promise.all(
    testData.chats.map(
      async (chat) => (await createChat(chat.name, dbgroupImage.id))!
    )
  );

  // For each chat, create new chatMembers, and push them into the `chatMembers` list.
  let chatMembers: ChatMember[] = [];
  for (const chat of testData.chats) {
    const newChatMembers = await Promise.all(
      chat.users.map(async (chatMemberIndex) => {
        const wkey = await createUserMasterKey(
          key,
          users[chatMemberIndex]!.username
        );
        const chatMember = await createChatMember(
          users[chatMemberIndex]!.id,
          chats.find((c) => c.name == chat.name)!.id,
          wkey
        );

        return chatMember!;
      })
    );
    chatMembers = [...chatMembers, ...newChatMembers];
  }

  let messages: Message[] = [];
  for (const chat of testData.chats) {
    const chatId = chats.find((c) => c.name == chat.name)!.id;
    const newMessages = await Promise.all(
      chat.messages.map(async (message) => {
        const senderId = users[message.authorIndex]!.id as string;
        const encryptedMessage = await encryptText(key, message.text);

        return (await createMessage(chatId, senderId, encryptedMessage))!;
      })
    );
    messages = [...messages, ...newMessages];
  }

  return {
    users,
    chats,
    chatMembers,
    messages,
  };
}

export default seedDatabase;
