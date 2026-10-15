const net = require('net');

/**
 * High-Speed Bridge to C++ Feed Ranking Microservice
 * Talks to C++ binary over local TCP socket (< 1ms latency)
 */
async function rankPostsWithCpp(userId, posts) {
  if (!posts || posts.length <= 1) return posts;

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responseData = '';

    socket.setTimeout(80); // 80ms timeout

    socket.connect(9090, '127.0.0.1', () => {
      let payload = `RANK:${userId}\n`;
      posts.forEach((p) => {
        const id = p.id || p._id || 0;
        const authorId = p.author_id || (p.author ? p.author.id : 0) || 0;
        const ts = p.created_at ? Math.floor(new Date(p.created_at).getTime() / 1000) : 0;
        const likes = (p.likes && Array.isArray(p.likes)) ? p.likes.length : 0;
        const comments = (p.comments && Array.isArray(p.comments)) ? p.comments.length : 0;
        payload += `POST:${id},${authorId},${ts},${likes},${comments}\n`;
      });
      socket.write(payload);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        if (parsed.ranked_ids && parsed.ranked_ids.length > 0) {
          const idMap = new Map(posts.map((p) => [(p.id || p._id).toString(), p]));
          const ranked = parsed.ranked_ids
            .map((id) => idMap.get(id.toString()))
            .filter(Boolean);
          // Append any remaining unranked posts
          posts.forEach((p) => {
            if (!ranked.includes(p)) ranked.push(p);
          });
          return resolve(ranked);
        }
      } catch (err) {}
      resolve(posts);
    });

    socket.on('error', () => {
      // C++ microservice offline - fall back to normal
      resolve(posts);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(posts);
    });
  });
}

module.exports = { rankPostsWithCpp };
