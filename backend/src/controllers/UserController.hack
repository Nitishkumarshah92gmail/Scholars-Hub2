<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\Controllers;

use ScholarsHub\Cache\LookAsideCache;

final class UserController {

  /**
   * GET /api/users/scholars
   */
  public static async function getScholarsAsync(): Awaitable<vec<dict<string, mixed>>> {
    return await LookAsideCache::rememberAsync('users:scholars:recent', 30, async () ==> {
      $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
      $supabaseKey = \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';
      if ($supabaseUrl === '' || $supabaseKey === '') return vec[];

      $url = \rtrim($supabaseUrl, '/')."/rest/v1/profiles?select=id,name,avatar,school&order=created_at.desc&limit=50";
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
        $raw = \json_decode((string)$res, true);
        if (\is_array($raw)) {
          foreach ($raw as $u) {
            $out[] = dict[
              '_id' => $u['id'] ?? '',
              'name' => $u['name'] ?? '',
              'avatar' => $u['avatar'] ?? '',
              'school' => $u['school'] ?? '',
            ];
          }
        }
      }
      return $out;
    });
  }

  /**
   * GET /api/users/stats/count
   */
  public static async function getStatsCountAsync(): Awaitable<dict<string, mixed>> {
    return await LookAsideCache::rememberAsync('stats:users:count', 60, async () ==> {
      return dict['totalUsers' => 0];
    });
  }
}
