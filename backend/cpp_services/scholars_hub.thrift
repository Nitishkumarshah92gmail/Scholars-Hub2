/**
 * Apache Thrift Interface Definition for Scholars Hub
 * High-Performance C++ Microservice Tier (Facebook Architecture)
 */

namespace cpp scholars_hub.rpc
namespace hack ScholarsHub.RPC

enum EdgeType {
  FOLLOWS = 101,
  LIKES = 102,
  AUTHORED = 103,
  COMMENTED = 104
}

struct PostCandidate {
  1: required i64 post_id,
  2: required i64 author_id,
  3: required i64 created_at_timestamp,
  4: required i32 like_count,
  5: required i32 comment_count,
  6: optional string subject,
  7: optional double base_score = 0.0
}

struct UserGraphContext {
  1: required i64 user_id,
  2: required set<i64> following_ids,
  3: required set<i64> affinity_author_ids,
  4: optional list<string> interested_subjects
}

struct FeedRankRequest {
  1: required UserGraphContext context,
  2: required list<PostCandidate> candidates,
  3: required i32 limit = 10,
  4: required i32 offset = 0
}

struct FeedRankResponse {
  1: required list<i64> ranked_post_ids,
  2: required i64 compute_time_nanoseconds,
  3: required string algorithm_version
}

struct PlaylistScrapeRequest {
  1: required string playlist_id,
  2: optional i32 max_results = 50
}

struct PlaylistItem {
  1: required string video_id,
  2: required string title,
  3: required string thumbnail_url,
  4: required i32 position
}

struct PlaylistScrapeResponse {
  1: required string playlist_title,
  2: required list<PlaylistItem> items,
  3: required bool success
}

service FeedService {
  FeedRankResponse rankFeed(1: FeedRankRequest request),
  PlaylistScrapeResponse processPlaylist(1: PlaylistScrapeRequest request),
  bool ping()
}
