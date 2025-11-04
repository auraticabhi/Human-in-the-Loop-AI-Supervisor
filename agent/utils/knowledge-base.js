// search for questions in database/knowledge-base

export class KnowledgeBase {
  // Creates an instance of KnowledgeBase
  constructor(backendUrl) { this.backendUrl = backendUrl; this.cache = new Map(); this.cacheExpiry = 5 * 60 * 1000; }

  //Searches the Knowledge Base for an answer, checking the local cache first
  async search(question) {
    const key = this.normalize(question);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) return cached.answer;

    try {
      const res = await fetch(`${this.backendUrl}/api/knowledge/search`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question })
      });
      const data = await res.json();
      if (data.success && data.found) {
        // Cache the result upon success
        this.cache.set(key, { answer: data.data.answer, timestamp: Date.now() });
        return data.data.answer;
      }
      return null;
    } catch (e) { console.error('KB search err:', e); return null; }
  }

  normalize(q) { return q.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' '); }
}