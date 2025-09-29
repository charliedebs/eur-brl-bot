const { handleUpdate } = require("../src/app/main");

// Simule une callback Telegram "guide=2.1"
const sampleUpdate = {
  callback_query: {
    data: "guide=2.1&route=eurbrl&amount=1000&lang=fr",
    message: { chat: { id: 12345 } }
  }
};

const res = handleUpdate({ update: sampleUpdate, state: {}, CONFIG: {} });
console.log("=== DEMO OUT ===");
console.log(JSON.stringify(res, null, 2));
