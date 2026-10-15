<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\RPC;

/**
 * High-Speed RPC Client connecting Hack (HHVM) to the C++ Feed Ranking Microservice
 */
final class FeedServiceClient {

  const string HOST = '127.0.0.1';
  const int PORT = 9090;

  /**
   * Dispatches candidate post IDs to the C++ ranking engine over TCP
   */
  public static async function rankFeedAsync(
    int $userId,
    vec<int> $candidatePostIds,
    vec<int> $followingIds,
    int $limit = 10,
    int $offset = 0,
  ): Awaitable<vec<int>> {
    if (\count($candidatePostIds) === 0) {
        return vec[];
    }

    try {
      // High-performance direct non-blocking TCP socket to C++ server
      $fp = @\fsockopen(self::HOST, self::PORT, inout $errno, inout $errstr, 0.05); // 50ms timeout
      if (!$fp) {
        // Fallback: in-memory sort if C++ microservice is offline
        return self::fallbackRank($candidatePostIds, $offset, $limit);
      }

      $payload = "RANK:{$userId}\n";
      foreach ($candidatePostIds as $pid) {
        // Simple serialization line
        $payload .= "POST:{$pid},1,0,0,0\n";
      }

      \fwrite($fp, $payload);
      $response = \fgets($fp);
      \fclose($fp);

      if ($response !== false) {
        $data = \json_decode($response, true);
        if ($data && isset($data['ranked_ids'])) {
          $ranked = vec[];
          foreach ($data['ranked_ids'] as $id) {
            $ranked[] = (int)$id;
          }
          return $ranked;
        }
      }
    } catch (\Exception $e) {
      // Graceful fallback
    }

    return self::fallbackRank($candidatePostIds, $offset, $limit);
  }

  private static function fallbackRank(
    vec<int> $candidatePostIds,
    int $offset,
    int $limit,
  ): vec<int> {
    $slice = \array_slice($candidatePostIds, $offset, $limit);
    $out = vec[];
    foreach ($slice as $id) {
        $out[] = (int)$id;
    }
    return $out;
  }
}
