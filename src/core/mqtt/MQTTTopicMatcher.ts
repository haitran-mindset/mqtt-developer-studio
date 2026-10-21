export class MQTTTopicMatcher {
  /**
   * Evaluates if an MQTT topic matches an MQTT subscription topic filter with wildcards (+, #)
   */
  static matches(filter: string, topic: string): boolean {
    if (filter === topic) return true;

    // Reject invalid '#' usage (must be last level, and preceded by / or standalone)
    const hashIndex = filter.indexOf('#');
    if (hashIndex !== -1) {
      if (hashIndex !== filter.length - 1) {
        return false; // '#' is not at the end
      }
      if (hashIndex > 0 && filter[hashIndex - 1] !== '/') {
        return false; // '#' must be preceded by '/'
      }
    }

    const filterLevels = filter.split('/');
    const topicLevels = topic.split('/');

    for (let i = 0; i < filterLevels.length; i++) {
      const f = filterLevels[i];

      if (f === '#') {
        // Multi-level wildcard matches everything from here on
        return true;
      }

      if (i >= topicLevels.length) {
        return false;
      }

      const t = topicLevels[i];

      if (f === '+') {
        // Single-level wildcard matches exactly one level
        continue;
      }

      if (f !== t) {
        return false;
      }
    }

    // Must match the exact number of levels unless filter ended in '#'
    return filterLevels.length === topicLevels.length;
  }
}

class TrieNode<T> {
  children: Map<string, TrieNode<T>> = new Map();
  singleWildcardChild?: TrieNode<T>;
  multiWildcardSubscribers: Set<T> = new Set();
  exactSubscribers: Set<T> = new Set();
}

export class TopicTrie<T> {
  private root: TrieNode<T> = new TrieNode<T>();

  subscribe(filter: string, subscriber: T): void {
    const levels = filter.split('/');
    let current = this.root;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];

      if (level === '#') {
        current.multiWildcardSubscribers.add(subscriber);
        return;
      }

      if (level === '+') {
        if (!current.singleWildcardChild) {
          current.singleWildcardChild = new TrieNode<T>();
        }
        current = current.singleWildcardChild;
      } else {
        let child = current.children.get(level);
        if (!child) {
          child = new TrieNode<T>();
          current.children.set(level, child);
        }
        current = child;
      }
    }

    current.exactSubscribers.add(subscriber);
  }

  unsubscribe(filter: string, subscriber: T): void {
    const levels = filter.split('/');
    let current: TrieNode<T> | undefined = this.root;

    for (let i = 0; i < levels.length; i++) {
      if (!current) return;
      const level = levels[i];

      if (level === '#') {
        current.multiWildcardSubscribers.delete(subscriber);
        return;
      }

      if (level === '+') {
        current = current.singleWildcardChild;
      } else {
        current = current.children.get(level);
      }
    }

    if (current) {
      current.exactSubscribers.delete(subscriber);
    }
  }

  match(topic: string): T[] {
    const levels = topic.split('/');
    const results = new Set<T>();

    const traverse = (node: TrieNode<T>, levelIndex: number) => {
      // Any '#' subscribers at this node match immediately
      for (const sub of node.multiWildcardSubscribers) {
        results.add(sub);
      }

      if (levelIndex === levels.length) {
        for (const sub of node.exactSubscribers) {
          results.add(sub);
        }
        return;
      }

      const currentLevel = levels[levelIndex];

      // Exact match branch
      const exactChild = node.children.get(currentLevel);
      if (exactChild) {
        traverse(exactChild, levelIndex + 1);
      }

      // Single wildcard '+' branch
      if (node.singleWildcardChild) {
        traverse(node.singleWildcardChild, levelIndex + 1);
      }
    };

    traverse(this.root, 0);
    return Array.from(results);
  }
}
