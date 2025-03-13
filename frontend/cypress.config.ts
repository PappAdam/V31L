import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        seedDatabase() {
          return fetch('http://localhost:3000/testapi/seed', {
            method: 'POST',
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  `Failed to seed database: ${response.statusText}`
                );
              }
              return 'Database seeded successfully';
            })
            .catch((error) => {
              console.error(error);
              throw error;
            });
        },
      });
    },
  },
});
