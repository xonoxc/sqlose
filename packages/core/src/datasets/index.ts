import { ok, err } from "neverthrow"
import { ImportError } from "@sqlose/shared"
import type { Dataset, AsyncAppResult } from "@sqlose/shared"

export interface DatasetSQL {
   datasetId: string
   sql: string
}

const DATASETS: Dataset[] = [
   {
      id: "ds-ecommerce",
      name: "Sample Ecommerce",
      description: "Products, orders, customers for an online store",
      category: "ecommerce",
      dbTypes: ["postgres", "mysql", "sqlite"],
   },
   {
      id: "ds-analytics",
      name: "Web Analytics",
      description: "Page views, sessions, events for analytics demo",
      category: "analytics",
      dbTypes: ["postgres", "mysql", "sqlite"],
   },
   {
      id: "ds-social",
      name: "Social Media",
      description: "Users, posts, comments, likes for social app",
      category: "social",
      dbTypes: ["postgres", "mysql", "sqlite"],
   },
   {
      id: "ds-finance",
      name: "Financial Data",
      description: "Transactions, accounts, categories for finance app",
      category: "finance",
      dbTypes: ["postgres", "mysql", "sqlite"],
   },
]

export const SAMPLE_DATASETS: Record<string, string> = {
   "ds-ecommerce": `CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (id, name, email) VALUES (1, 'Alice Smith', 'alice@example.com');
INSERT INTO customers (id, name, email) VALUES (2, 'Bob Johnson', 'bob@example.com');
INSERT INTO customers (id, name, email) VALUES (3, 'Charlie Brown', 'charlie@example.com');

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL
);

INSERT INTO products (id, name, price, category) VALUES (1, 'Widget', 19.99, 'Gadgets');
INSERT INTO products (id, name, price, category) VALUES (2, 'Gadget Pro', 49.99, 'Gadgets');
INSERT INTO products (id, name, price, category) VALUES (3, 'Thingamajig', 9.99, 'Widgets');

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total REAL NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (id, customer_id, product_id, quantity, total) VALUES (1, 1, 1, 2, 39.98);
INSERT INTO orders (id, customer_id, product_id, quantity, total) VALUES (2, 2, 2, 1, 49.99);
INSERT INTO orders (id, customer_id, product_id, quantity, total) VALUES (3, 1, 3, 5, 49.95);
INSERT INTO orders (id, customer_id, product_id, quantity, total) VALUES (4, 3, 1, 1, 19.99);`,

   "ds-analytics": `CREATE TABLE page_views (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO page_views (id, url, referrer, user_agent, ip_address) VALUES (1, '/home', 'https://google.com', 'Mozilla/5.0', '192.168.1.1');
INSERT INTO page_views (id, url, referrer, user_agent, ip_address) VALUES (2, '/pricing', '/home', 'Mozilla/5.0', '192.168.1.1');
INSERT INTO page_views (id, url, referrer, user_agent, ip_address) VALUES (3, '/signup', '/pricing', 'Mozilla/5.0', '192.168.1.1');

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_views INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sessions (id, session_id, page_views, duration_seconds) VALUES (1, 'sess_abc123', 3, 120);
INSERT INTO sessions (id, session_id, page_views, duration_seconds) VALUES (2, 'sess_def456', 1, 30);`,

   "ds-social": `CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, display_name, bio) VALUES (1, 'alice', 'Alice', 'Hello world!');
INSERT INTO users (id, username, display_name, bio) VALUES (2, 'bob', 'Bob', 'Just chillin');
INSERT INTO users (id, username, display_name, bio) VALUES (3, 'carol', 'Carol', 'Living my best life');

CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (id, user_id, content, likes) VALUES (1, 1, 'My first post!', 5);
INSERT INTO posts (id, user_id, content, likes) VALUES (2, 2, 'Having a great day', 3);
INSERT INTO posts (id, user_id, content, likes) VALUES (3, 3, 'Check out this cool thing', 12);
INSERT INTO posts (id, user_id, content, likes) VALUES (4, 1, 'Another update', 2);`,

   "ds-finance": `CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO accounts (id, name, type, balance) VALUES (1, 'Checking', 'checking', 2500.00);
INSERT INTO accounts (id, name, type, balance) VALUES (2, 'Savings', 'savings', 10000.00);
INSERT INTO accounts (id, name, type, balance) VALUES (3, 'Credit Card', 'credit', -500.00);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  category TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO transactions (id, account_id, amount, description, category) VALUES (1, 1, -50.00, 'Grocery store', 'Food');
INSERT INTO transactions (id, account_id, amount, description, category) VALUES (2, 2, 500.00, 'Paycheck deposit', 'Income');
INSERT INTO transactions (id, account_id, amount, description, category) VALUES (3, 1, -25.00, 'Netflix subscription', 'Entertainment');
INSERT INTO transactions (id, account_id, amount, description, category) VALUES (4, 3, -100.00, 'Amazon purchase', 'Shopping');
INSERT INTO transactions (id, account_id, amount, description, category) VALUES (5, 1, -2000.00, 'Rent payment', 'Housing');`,
}

export function listDatasets(): AsyncAppResult<Dataset[]> {
   return Promise.resolve(ok(DATASETS))
}

export function getDatasetSQL(datasetId: string): AsyncAppResult<string> {
   const sql = SAMPLE_DATASETS[datasetId]
   if (!sql)
      return Promise.resolve(
         err(new ImportError("import:parse_failed", `Dataset ${datasetId} not found`))
      )
   return Promise.resolve(ok(sql))
}
