import { TwitterApi } from "twitter-api-v2";

const {
  X_API_KEY,
  X_API_KEY_SECRET,
  X_ACCESS_TOKEN,
  X_ACCESS_TOKEN_SECRET,
} = process.env;

if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
  throw new Error("X credentials are not set");
}

export async function postTweet(tweet: string, videoPath: string) {
  const client = new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_KEY_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_TOKEN_SECRET,
  }).readWrite;

  await client.v2.tweet(tweet, {
    media: {
      media_ids: [videoPath],
    },
  });
}