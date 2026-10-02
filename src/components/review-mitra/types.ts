"use client";

export type Platform = "google" | "facebook" | "justdial";
export type Tone = "friendly" | "professional" | "hinglish" | "brief";
export type Sentiment = "positive" | "neutral" | "negative";

export interface ReviewItem {
  id: string;
  platform: string;
  externalId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  rating: number;
  reviewText: string | null;
  sentiment: string;
  reviewTimestamp: string;
  isReplied: boolean;
  lastReply: { text: string; tone: string; createdAt: string } | null;
}

export interface BusinessInfo {
  id: string;
  name: string;
  category: string | null;
  phoneSupport: string | null;
  defaultTone: string;
}

export interface ConnectionInfo {
  platform: string;
  status: string;
  lastSyncAt: string | null;
}

export interface SubscriptionInfo {
  planName: string;
  status: string;
  monthlyAiReplyLimit: number;
  aiRepliesUsed: number;
  currentPeriodEnd: string | null;
}

export interface ReviewsResponse {
  business: BusinessInfo;
  connections: ConnectionInfo[];
  subscription: SubscriptionInfo | null;
  reviews: ReviewItem[];
}
