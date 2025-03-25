import seedDatabase from "prisma/seed/seed";

export let database: Awaited<ReturnType<typeof seedDatabase>> = {
  users: [],
  chats: [],
  chatMembers: [],
  messages: [],
};

beforeEach(async () => {
  jest.clearAllMocks();
  database = await seedDatabase();
});
