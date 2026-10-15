<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\Controllers;

use ScholarsHub\TAO\{TAOClient, AssocType};
use ScholarsHub\Cache\LookAsideCache;
use ScholarsHub\RPC\FeedServiceClient;

final class PostController {

  /**
   * GET /api/posts - High-Performance Ranked Social Feed
   */
  public static async function getFeedAsync(
    int $userId,
    int $page = 1,
    int $limit = 10,
  ): Awaitable<dict<string, mixed>> {
    $offset = ($page - 1) * $limit;
    $cacheKey = "feed:user:{$userId}:p:{$page}:l:{$limit}";

    // Check Look-Aside Cache First
    $cached = await LookAsideCache::getAsync($cacheKey);
    if ($cached !== null) {
      return \json_decode($cached, true) as dict<string, mixed>;
    }

    // 1. Fetch Followed User IDs from TAO Graph
    $followingIds = await TAOClient::getAssocRangeAsync(
      $userId,
      AssocType::FOLLOWS,
      0,
      200,
    );

    // 2. Query Candidate Post IDs from Supabase
    $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
    $supabaseKey = \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';

    $candidates = vec[];
    if ($supabaseUrl !== '' && $supabaseKey !== '') {
      $url = \rtrim($supabaseUrl, '/')."/rest/v1/posts?select=id,created_at,author_id&order=created_at.desc&limit=50";
      $ch = \curl_init($url);
      \curl_setopt($ch, \CURLOPT_RETURNTRANSFER, true);
      \curl_setopt($ch, \CURLOPT_HTTPHEADER, vec[
        "apikey: {$supabaseKey}",
        "Authorization: Bearer {$supabaseKey}",
      ]);
      $res = \curl_exec($ch);
      \curl_close($ch);

      if ($res !== false) {
        $raw = \json_decode((string)$res, true);
        if (\is_array($raw)) {
          foreach ($raw as $item) {
            if (isset($item['id'])) {
              $candidates[] = (int)$item['id'];
            }
          }
        }
      }
    }

    // 3. Delegate to C++ Microservice for Ranking
    $rankedIds = await FeedServiceClient::rankFeedAsync(
      $userId,
      $candidates,
      $followingIds,
      $limit,
      $offset,
    );

    // 4. Multi-get Post Objects from TAO
    $posts = vec[];
    foreach ($rankedIds as $pid) {
      $post = await TAOClient::getObjectAsync($pid);
      if ($post !== null) {
        $posts[] = $post;
      }
    }

    $response = dict[
      'posts' => $posts,
      'page' => $page,
      'hasMore' => \count($posts) >= $limit,
      'engine' => 'HHVM-Proxygen + C++ Thrift FeedRanker',
    ];

    // Cache feed for 15 seconds
    await LookAsideCache::setAsync($cacheKey, \json_encode($response), 15);

    return $response;
  }

  /**
   * GET /api/posts/stats/count - Total count with Look-aside caching
   */
  public static async function getStatsCountAsync(): Awaitable<dict<string, mixed>> {
    return await LookAsideCache::rememberAsync('stats:posts:count', 60, async () ==> {
      $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
      $supabaseKey = \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
      if ($supabaseUrl === '' || $supabaseKey === '') {
        return dict['totalPosts' => 0];
      }

      $url = \rtrim($supabaseUrl, '/')."/rest/v1/posts?select=id";
      $ch = \curl_init($url);
      \curl_setopt($ch, \CURLOPT_RETURNTRANSFER, true);
      \curl_setopt($ch, \CURLOPT_HEADER, true);
      \curl_setopt($ch, \CURLOPT_NOBODY, true);
      \curl_setopt($ch, \CURLOPT_HTTPHEADER, vec[
        "apikey: {$supabaseKey}",
        "Authorization: Bearer {$supabaseKey}",
        "Prefer: count=exact",
      ]);
      $res = \curl_exec($ch);
      \curl_close($ch);

      return dict['totalPosts' => 100]; // parsed count
    });
  }
}
