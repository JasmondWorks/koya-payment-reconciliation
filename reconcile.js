const fs = require("fs");

// Returns the parsed object, or null if the line can't be read
const parseLine = (line) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};
const toNumber = (value) => Number(String(value).replace(/[^0-9.-]/g, ""));

// 1. Read the file, parse each line, drop unreadable lines and events without a txn_id
const events = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .map(parseLine)
  .filter((event) => event && event.txn_id);

// 2. Sort oldest -> newest, then keep one event per txn_id (the newest one wins)
const latestByTxn = new Map(
  events
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
    .map((event) => [event.txn_id, event])
);

// 3. Of those latest attempts, keep only the successful ones
const successful = [...latestByTxn.values()].filter(
  (event) => event.status === "success"
);

// 4. Count them and add up the amounts
const count = successful.length;
const total = successful.reduce((sum, event) => sum + toNumber(event.amount), 0);

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}