import { createChat } from "@/db/chat";
import { createChatMember } from "@/db/chatMember";
import { createMessage } from "@/db/message";
import { createUser } from "@/db/user";
import { EncryptedMessage, stringToCharCodeArray } from "@common";
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

async function wrapKey(key: CryptoKey, wrapKey: CryptoKey) {
  return new Uint8Array(
    await crypto.subtle.wrapKey("raw", key, wrapKey, { name: "AES-KW" })
  );
}

async function createUserMasterKey(username: string, password: string) {
  const encoder = new TextEncoder();

  const rawKey = new Uint8Array(
    await crypto.subtle.digest(
      { name: "SHA-256" },
      stringToCharCodeArray(username + password)
    )
  );

  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const master = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(
        await crypto.subtle.digest(
          { name: "SHA-256" },
          stringToCharCodeArray("000000")
        )
      ),
      iterations: 100000,
    },
    key,
    { name: "AES-KW", length: 256 },
    true,
    ["wrapKey", "unwrapKey"]
  );

  return master;
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
  const dbpfpImage = await createImage(
    pfpImgData,
    "data:image/png;base64",
    "pfpImg"
  );
  if (!dbpfpImage) {
    throw Error("Failed to create image");
  }

  const groupImgData = await readImg("./prisma/seed/img/group.png");
  const dbgroupImage = await createImage(
    groupImgData,
    "data:image/png;base64",
    "groupImg"
  );

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
        const user = users[chatMemberIndex]!;
        const master = await createUserMasterKey(
          user.username,
          user.passwordNotHashed
        );

        const chatMember = await createChatMember(
          user.id,
          chats.find((c) => c.name == chat.name)!.id,
          await wrapKey(key, master)
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

        return (await createMessage(
          chatId,
          senderId,
          encryptedMessage,
          "TEXT"
        ))!;
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
