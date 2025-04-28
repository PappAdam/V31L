import seedDatabase from "@/../prisma/seed/seed";
import prisma from "@/db/_db";

export let database: Awaited<ReturnType<typeof seedDatabase>> = {
  users: [],
  chats: [],
  chatMembers: [],
  messages: [],
};

beforeAll(() => {
  deepSpyOn(prisma);
});

beforeEach(async () => {
  database = await seedDatabase();
  jest.clearAllMocks();
}, 10000);

/**
 * Function used to spy on a nested object. The function will spy on every function the object has.
 * @param object The object to spy on
 */
function deepSpyOn(object: Object, visited = new WeakSet()) {
  const obj = object as any;

  if (typeof obj !== "object" || obj === null || visited.has(obj)) return;
  visited.add(obj);

  if (Array.isArray(obj)) {
    obj.forEach((item) => deepSpyOn(item, visited));
    return;
  }

  Object.getOwnPropertyNames(obj).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor && !descriptor.configurable) return;

    const value = obj[key];

    if (typeof value === "function") {
      jest.spyOn(obj, key);
    } else if (typeof value === "object" && value !== null) {
      deepSpyOn(value, visited);
    }
  });
}
