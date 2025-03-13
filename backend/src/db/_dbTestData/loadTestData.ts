import { createChat } from "../chat";
import { createMessage } from "../message";
import testData from "./testData.json";
import { createUser } from "../user";
import prisma from "../_db";

export async function loadData() {
  await prisma.message.deleteMany();
  await prisma.chatMember.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all(
    testData.users.map(async (u) => createUser(u.username, u.password))
  );
  testData.groups.forEach(async (g) => {
    const groupMembers = g.users.map((u) => users[u]?.id as string);
    const group = await createChat(g.group_name, groupMembers);
    g.messages.forEach((m) => {
      const senderId = users[m.from]?.id as string;
      createMessage(group?.id as string, senderId, m.text);
    });
  });
}

loadData();
