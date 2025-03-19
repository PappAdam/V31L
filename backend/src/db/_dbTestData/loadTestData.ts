import { createChat } from "../chat";
import { createMessage } from "../message";
import testData from "./testData.json";
import { createUser } from "../user";
import { EncryptedMessage } from "@common";
import { addUserToChat } from "../chatMember";

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

async function loadData() {
  const key = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(32),
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );

  const users = await Promise.all(
    testData.users.map(async (u) => createUser(u.username, u.password))
  );
  testData.groups.forEach(async (g) => {
    const group = await createChat(g.group_name);
    g.users.forEach(async (u) => {
      const wkey = await createUserMasterKey(key, users[u]?.username!);
      addUserToChat(users[u]?.id!, group?.id!, wkey);
    });
    g.messages.forEach(async (m) => {
      const senderId = users[m.from]?.id as string;

      const message = await encryptText(key, m.text);

      createMessage(group?.id as string, senderId, message);
    });
  });
}

loadData();
