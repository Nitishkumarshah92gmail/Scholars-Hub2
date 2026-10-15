<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\Controllers;

final class AuthController {

  /**
   * GET /api/auth/me
   */
  public static async function getMeAsync(?string $token): Awaitable<dict<string, mixed>> {
    if ($token === null || $token === '') {
      return dict['error' => 'No token provided'];
    }

    $supabaseUrl = \getenv('SUPABASE_URL') ?: '';
    $supabaseKey = \getenv('SUPABASE_ANON_KEY') ?: \getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '';

    $ch = \curl_init(\rtrim($supabaseUrl, '/')."/auth/v1/user");
    \curl_setopt($ch, \CURLOPT_RETURNTRANSFER, true);
    \curl_setopt($ch, \CURLOPT_HTTPHEADER, vec[
      "apikey: {$supabaseKey}",
      "Authorization: Bearer {$token}",
    ]);
    $res = \curl_exec($ch);
    \curl_close($ch);

    if ($res !== false) {
      $user = \json_decode((string)$res, true);
      if (\is_array($user) && isset($user['id'])) {
        return dict[
          '_id' => $user['id'],
          'email' => $user['email'] ?? '',
          'name' => $user['user_metadata']['name'] ?? 'User',
          'avatar' => $user['user_metadata']['avatar'] ?? '',
        ];
      }
    }

    return dict['error' => 'Invalid token'];
  }
}
