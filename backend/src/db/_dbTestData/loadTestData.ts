import { createChat } from "../chat";
import { createMessage } from "../message";
import testData from "./testData.json";
import { createUser } from "../user";
import { EncryptedMessage } from "@common";

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
    const groupMembers = g.users.map((u) => users[u]?.id as string);
    const group = await createChat(g.group_name, groupMembers);
    g.messages.forEach(async (m) => {
      const senderId = users[m.from]?.id as string;

      const message = await encryptText(key, m.text);

      createMessage(group?.id as string, senderId, message);
    });
  });
}

loadData();
