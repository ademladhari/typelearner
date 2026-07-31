import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Headphones, Minus, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://typelearner.onrender.com';

const Dashboard = () => {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/words`);
      setWords(response.data);
    } catch {
      setError('Could not load words from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const totalWeight = useMemo(
    () => words.reduce((sum, word) => sum + Math.max(word.score, 1), 0),
    [words],
  );

  const filteredWords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return words;
    return words.filter((word) => word.word.toLowerCase().includes(needle));
  }, [words, query]);

  const addWord = async (event) => {
    event.preventDefault();
    const word = newWord.trim();
    if (!word || saving) return;

    try {
      setSaving(true);
      const response = await axios.post(`${API_URL}/words`, { word, score: 1 });
      setWords((previous) =>
        [...previous, response.data].sort((a, b) => b.score - a.score || a.word.localeCompare(b.word)),
      );
      setNewWord('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add that word.');
    } finally {
      setSaving(false);
    }
  };

  const updateScore = async (word, nextScore) => {
    const score = Math.max(1, nextScore);
    setWords((previous) =>
      previous
        .map((item) => (item.word === word ? { ...item, score } : item))
        .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word)),
    );

    try {
      await axios.patch(`${API_URL}/words/${encodeURIComponent(word)}`, { score });
    } catch {
      setError('Score could not be saved.');
      fetchWords();
    }
  };

  const removeWord = async (word) => {
    setWords((previous) => previous.filter((item) => item.word !== word));
    try {
      await axios.delete(`${API_URL}/words/${encodeURIComponent(word)}`);
    } catch {
      setError('Word could not be removed.');
      fetchWords();
    }
  };

  const chance = (score) => {
    if (!totalWeight) return '0%';
    return `${((Math.max(score, 1) / totalWeight) * 100).toFixed(1)}%`;
  };

  return (
    <main className="app-shell">
      <header className="topbar dashboard-topbar">
        <a className="brand" href="/" aria-label="Typelearner home">
          <span className="brand-mark"><Headphones size={20} /></span>
          <span>type<span>learner</span></span>
        </a>
        <nav className="top-nav">
          <a href="/">Practice</a>
          <a href="/dashboard" aria-current="page">Words</a>
        </nav>
      </header>

      <section className="dashboard-layout">
        <div className="dashboard-intro">
          <a className="back-link" href="/"><ArrowLeft size={16} /> Back to practice</a>
          <h1>Word dashboard</h1>
          <p className="lede">
            Higher score means the word shows up more often. Lower score means you know it better, so it appears less.
          </p>
        </div>

        <section className="dashboard-panel">
          <form className="add-word-form" onSubmit={addWord}>
            <label htmlFor="new-word">Add a word</label>
            <div className="add-word-row">
              <input
                id="new-word"
                value={newWord}
                onChange={(event) => setNewWord(event.target.value)}
                placeholder="Type a new word…"
                autoComplete="off"
              />
              <button type="submit" disabled={!newWord.trim() || saving}>
                <Plus size={17} /> Add
              </button>
            </div>
          </form>

          <div className="dashboard-toolbar">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter words…"
              aria-label="Filter words"
            />
            <span>{words.length} words</span>
          </div>

          {loading ? (
            <p className="dashboard-empty">Loading words…</p>
          ) : filteredWords.length === 0 ? (
            <p className="dashboard-empty">No words match that filter.</p>
          ) : (
            <ul className="word-list">
              {filteredWords.map((item) => (
                <li key={item._id || item.word}>
                  <div className="word-main">
                    <strong>{item.word}</strong>
                    <span>shows ~{chance(item.score)} of the time</span>
                  </div>
                  <div className="word-score-controls">
                    <button
                      type="button"
                      aria-label={`Lower score for ${item.word}`}
                      onClick={() => updateScore(item.word, item.score - 1)}
                      disabled={item.score <= 1}
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.score}
                      aria-label={`Score for ${item.word}`}
                      onChange={(event) => updateScore(item.word, Number(event.target.value) || 1)}
                    />
                    <button
                      type="button"
                      aria-label={`Raise score for ${item.word}`}
                      onClick={() => updateScore(item.word, item.score + 1)}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      type="button"
                      className="danger-action"
                      aria-label={`Remove ${item.word}`}
                      onClick={() => removeWord(item.word)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>

      {error && (
        <button className="toast" onClick={() => setError(null)}>
          {error}
          <span>Dismiss</span>
        </button>
      )}
    </main>
  );
};

export default Dashboard;
