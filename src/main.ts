import "./assets/main.css";

import { createApp } from "vue";
import App from "./App.vue";
import { db } from "./services/db";
import router from "./router";
import "@/assets/main.css";

const resetDatabase = () => {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.deleteDatabase("HabitTrackerDB");

    req.onsuccess = () => {
      resolve(true);
    };

    req.onerror = () => {
      reject(new Error("Failed to delete database"));
    };
  });
};

db.open()
  .then(() => {})
  .catch(async (err) => {
    if (err.name === "VersionError") {
      try {
        await resetDatabase();
        window.location.reload();
      } catch (resetError) {}
    }
  });

const app = createApp(App);
app.use(router);
app.mount("#app");
