-- Create tables for deX tweet trading platform

-- Tweets/Markets table
CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  tweet_url TEXT NOT NULL,
  tweet_text TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_name TEXT NOT NULL,
  initial_likes INTEGER DEFAULT 0,
  initial_retweets INTEGER DEFAULT 0,
  initial_replies INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Market liquidity pools for each tweet
CREATE TABLE IF NOT EXISTS liquidity_pools (
  tweet_id TEXT PRIMARY KEY REFERENCES tweets(id),
  reserve_tokens DECIMAL NOT NULL DEFAULT 1000000, -- Virtual token reserves
  reserve_sol DECIMAL NOT NULL DEFAULT 1000, -- Virtual SOL reserves (or whatever base currency)
  total_volume DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  tweet_id TEXT REFERENCES tweets(id),
  token_balance DECIMAL NOT NULL DEFAULT 0,
  average_buy_price DECIMAL NOT NULL DEFAULT 0,
  total_invested DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_address, tweet_id)
);

-- Trade history
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT REFERENCES tweets(id),
  user_address TEXT NOT NULL,
  trade_type TEXT NOT NULL, -- 'buy' or 'sell'
  token_amount DECIMAL NOT NULL,
  sol_amount DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  slippage DECIMAL NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tweet metrics history for tracking virality
CREATE TABLE IF NOT EXISTS tweet_metrics (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT REFERENCES tweets(id),
  likes INTEGER NOT NULL,
  retweets INTEGER NOT NULL,
  replies INTEGER NOT NULL,
  engagement_score DECIMAL NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_address);
CREATE INDEX IF NOT EXISTS idx_trades_tweet ON trades(tweet_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_address);
CREATE INDEX IF NOT EXISTS idx_tweet_metrics_tweet ON tweet_metrics(tweet_id);
