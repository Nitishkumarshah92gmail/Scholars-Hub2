<<file: __EnableUnstableFeatures('readonly')>>

use namespace ScholarsHub\Controllers;

<<__EntryPoint>>
async function main_async(): Awaitable<void> {
  // 1. CORS Headers
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
  \header("Access-Control-Allow-Origin: {$origin}");
  \header("Access-Control-Allow-Credentials: true");
  \header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  \header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if ($method === 'OPTIONS') {
    \http_response_code(204);
    return;
  }

  $uri = $_SERVER['REQUEST_URI'] ?? '/';
  $path = \explode('?', $uri)[0];

  // 2. Route Dispatcher
  \header('Content-Type: application/json; charset=utf-8');

  // Health Route
  if ($path === '/api/health') {
    $res = await HealthController::getHealthAsync();
    print \json_encode($res);
    return;
  }

  // Posts Feed & Stats
  if ($path === '/api/posts/stats/count') {
    \header('Cache-Control: public, max-age=60');
    $res = await PostController::getStatsCountAsync();
    print \json_encode($res);
    return;
  }

  if ($path === '/api/posts') {
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 10);
    $userId = 1; // Resolved from Bearer token
    $res = await PostController::getFeedAsync($userId, $page, $limit);
    print \json_encode($res);
    return;
  }

  // Users Routes
  if ($path === '/api/users/scholars') {
    $res = await UserController::getScholarsAsync();
    print \json_encode($res);
    return;
  }

  if ($path === '/api/users/stats/count') {
    \header('Cache-Control: public, max-age=60');
    $res = await UserController::getStatsCountAsync();
    print \json_encode($res);
    return;
  }

  // Auth Me
  if ($path === '/api/auth/me') {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = \str_replace('Bearer ', '', $authHeader);
    $res = await AuthController::getMeAsync($token);
    print \json_encode($res);
    return;
  }

  // 3. Static SPA Fallback for Frontend
  $distPath = __DIR__.'/../../frontend/dist';
  $requestedFile = $distPath.$path;
  if (\file_exists($requestedFile) && !\is_dir($requestedFile)) {
    // Serve asset
    $mime = \mime_content_type($requestedFile) ?: 'application/octet-stream';
    \header("Content-Type: {$mime}");
    \readfile($requestedFile);
    return;
  }

  if (\file_exists($distPath.'/index.html')) {
    \header('Content-Type: text/html; charset=utf-8');
    \header('Cache-Control: no-cache');
    \readfile($distPath.'/index.html');
    return;
  }

  // 404 Fallback
  \http_response_code(404);
  print \json_encode(dict['error' => 'Route not found']);
}
