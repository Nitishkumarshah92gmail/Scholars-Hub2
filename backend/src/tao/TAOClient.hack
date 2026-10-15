<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\TAO;

use ScholarsHub\Cache\LookAsideCache;

enum ObjectType: int {
  USER = 1;
  POST = 2;
  COMMENT = 3;
  PLAYLIST = 4;
}

enum AssocType: int {
  FOLLOWS = 101;
  LIKES = 102;
  AUTHORED = 103;
  COMMENTED = 104;
}

/**
 * Facebook TAO (The Association and Object layer) Client
 */
final class TAOClient {

  /**
   * Fetch Object by ID (Look-aside Cached)
   */
  public static async function getObjectAsync(int $id): Awaitable<?dict<string, mixed>> {
    $cacheKey = "tao:obj:{$id}";
    $cached = await LookAsideCache::getAsync($cacheKey);
    if ($cached !== null) {
      return \json_decode($cached, true) as ?dict<string, mixed>;
    }

    // Cache Miss: Query Supabase / Postgres
    $obj = await self::fetchObjectFromStorageAsync($id);
    if ($obj !== null) {
      await LookAsideCache::setAsync($cacheKey, \json_encode($obj), 3600);
    }
    return $obj;
  }

  /**
   * Fetch Association range (e.g. Followers, Likes on a post, Following list)
   */
  public static async function getAssocRangeAsync(
    int $id1,
    AssocType $atype,
    int $offset = 0,
    int $limit = 50,
  ): Awaitable<vec<int>> {
    $cacheKey = "tao:assoc:{$id1}:{$atype}:{$offset}:{$limit}";
    $cached = await LookAsideCache::getAsync($cacheKey);
    if ($cached !== null) {
      return \json_decode($cached, true) as vec<int>;
    }

    $ids = await self::fetchAssocRangeFromStorageAsync($id1, $atype, $offset, $limit);
    await LookAsideCache::setAsync($cacheKey, \json_encode($ids), 300);
    return $ids;
  }

  /**
   * Invalidate associations and objects when mutations occur (Post created, liked, followed)
   */
  public static async function invalidateAssocAsync(int $id1, AssocType $atype): Awaitable<void> {
    await LookAsideCache::deleteAsync("tao:assoc:{$id1}:{$atype}:0:50");
    await LookAsideCache::deleteAsync("tao:assoc:{$id1}:{$atype}:0:10");
  }

  private static async function fetchObjectFromStorageAsync(int $id): Awaitable<?dict<string, mixed>> {
    $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
    $supabaseKey = \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
    if ($supabaseUrl === '' || $supabaseKey === '') return null;

    $url = \rtrim($supabaseUrl, '/')."/rest/v1/posts?id=eq.{$id}&select=*";
    $ch = \curl_init($url);
    \curl_setopt($ch, \CURLOPT_RETURNTRANSFER, true);
    \curl_setopt($ch, \CURLOPT_HTTPHEADER, vec[
      "apikey: {$supabaseKey}",
      "Authorization: Bearer {$supabaseKey}",
    ]);
    $res = \curl_exec($ch);
    \curl_close($ch);

    if ($res !== false) {
      $list = \json_decode((string)$res, true);
      if (\is_array($list) && \count($list) > 0) {
        return $list[0] as dict<string, mixed>;
      }
    }
    return null;
  }

  private static async function fetchAssocRangeFromStorageAsync(
    int $id1,
    AssocType $atype,
    int $offset,
    int $limit,
  ): Awaitable<vec<int>> {
    // Queries junction tables (e.g. follows, likes) from Supabase
    $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
    $supabaseKey = \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
    if ($supabaseUrl === '' || $supabaseKey === '') return vec[];

    $table = ($atype === AssocType::FOLLOWS) ? 'follows' : 'likes';
    $field = ($atype === AssocType::FOLLOWS) ? 'following_id' : 'user_id';
    $filter = ($atype === AssocType::FOLLOWS) ? "follower_id=eq.{$id1}" : "post_id=eq.{$id1}";

    $url = \rtrim($supabaseUrl, '/')."/rest/v1/{$table}?{$filter}&select={$field}&limit={$limit}&offset={$offset}";
    $ch = \curl_init($url);
    \curl_setopt($ch, \CURLOPT_RETURNTRANSFER, true);
    \curl_setopt($ch, \CURLOPT_HTTPHEADER, vec[
      "apikey: {$supabaseKey}",
      "Authorization: Bearer {$supabaseKey}",
    ]);
    $res = \curl_exec($ch);
    \curl_close($ch);

    $out = vec[];
    if ($res !== false) {
      $list = \json_decode((string)$res, true);
      if (\is_array($list)) {
        foreach ($list as $row) {
          if (isset($row[$field])) {
            $out[] = (int)$row[$field];
          }
        }
      }
    }
    return $out;
  }
}
