<<file: __EnableUnstableFeatures('readonly')>>

namespace ScholarsHub\Cache;

/**
 * Facebook-style Look-Aside Cache with Lease Locking
 * Prevents Cache Stampede (Dogpile Effect) under high concurrency.
 */
final class LookAsideCache {

  public static async function getAsync(string $key): Awaitable<?string> {
    // 1. Check HHVM APC (In-Process Fast Memory Cache, < 0.1ms)
    $success = false;
    $val = \apc_fetch($key, inout $success);
    if ($success && \is_string($val)) {
      return $val;
    }

    // 2. Check Redis / Memcached via TCP Socket if configured
    $redisHost = \getenv('REDIS_HOST') ?: '';
    if ($redisHost !== '') {
      return await self::getFromRedisSocketAsync($redisHost, $key);
    }

    return null;
  }

  public static async function setAsync(
    string $key,
    string $value,
    int $ttlSeconds = 300,
  ): Awaitable<void> {
    // 1. Store in HHVM APC
    \apc_store($key, $value, $ttlSeconds);

    // 2. Store in Redis if configured
    $redisHost = \getenv('REDIS_HOST') ?: '';
    if ($redisHost !== '') {
      await self::setInRedisSocketAsync($redisHost, $key, $value, $ttlSeconds);
    }
  }

  public static async function deleteAsync(string $key): Awaitable<void> {
    \apc_delete($key);
    $redisHost = \getenv('REDIS_HOST') ?: '';
    if ($redisHost !== '') {
      await self::deleteInRedisSocketAsync($redisHost, $key);
    }
  }

  /**
   * Look-Aside Cache Fetcher with Dogpile Lease Lock
   */
  public static async function rememberAsync<T>(
    string $key,
    int $ttlSeconds,
    (function(): Awaitable<T>) $fallbackFn,
  ): Awaitable<T> {
    $cached = await self::getAsync($key);
    if ($cached !== null) {
      return \json_decode($cached, true) as T;
    }

    // Acquire 2-second lock to prevent stampede
    $lockKey = 'lock:'.$key;
    $hasLock = \apc_add($lockKey, '1', 2);

    if (!$hasLock) {
      // Another coroutine is already fetching; sleep 30ms and retry cache
      await \HH\Asio\usleep(30000);
      $retried = await self::getAsync($key);
      if ($retried !== null) {
        return \json_decode($retried, true) as T;
      }
    }

    try {
      $fresh = await $fallbackFn();
      await self::setAsync($key, \json_encode($fresh), $ttlSeconds);
      return $fresh;
    } finally {
      \apc_delete($lockKey);
    }
  }

  private static async function getFromRedisSocketAsync(
    string $host,
    string $key,
  ): Awaitable<?string> {
    try {
      $fp = @\fsockopen($host, 6379, inout $errno, inout $errstr, 0.2);
      if (!$fp) return null;
      \fwrite($fp, "*2\r\n$3\r\nGET\r\n$".\strlen($key)."\r\n{$key}\r\n");
      $line = \fgets($fp);
      if ($line === false || $line[0] !== '$') {
        \fclose($fp);
        return null;
      }
      $length = (int)\substr($line, 1);
      if ($length === -1) {
        \fclose($fp);
        return null;
      }
      $data = \fread($fp, $length);
      \fclose($fp);
      return $data;
    } catch (\Exception $e) {
      return null;
    }
  }

  private static async function setInRedisSocketAsync(
    string $host,
    string $key,
    string $val,
    int $ttl,
  ): Awaitable<void> {
    try {
      $fp = @\fsockopen($host, 6379, inout $errno, inout $errstr, 0.2);
      if (!$fp) return;
      $cmd = "*4\r\n$5\r\nSETEX\r\n$".\strlen($key)."\r\n{$key}\r\n$".\strlen((string)$ttl)."\r\n{$ttl}\r\n$".\strlen($val)."\r\n{$val}\r\n";
      \fwrite($fp, $cmd);
      \fclose($fp);
    } catch (\Exception $e) {}
  }

  private static async function deleteInRedisSocketAsync(
    string $host,
    string $key,
  ): Awaitable<void> {
    try {
      $fp = @\fsockopen($host, 6379, inout $errno, inout $errstr, 0.2);
      if (!$fp) return;
      \fwrite($fp, "*2\r\n$3\r\nDEL\r\n$".\strlen($key)."\r\n{$key}\r\n");
      \fclose($fp);
    } catch (\Exception $e) {}
  }
}
