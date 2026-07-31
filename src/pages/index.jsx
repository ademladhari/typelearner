/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  ArrowRight,
  Check,
  Headphones,
  Lightbulb,
  RotateCcw,
  Settings2,
  Trash2,
  Volume2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://typelearner.onrender.com';

const App = () => {
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [firstAttempt, setFirstAttempt] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const showWordTimeoutRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const inputRef = useRef(null);

  const populateVoiceList = useCallback(() => {
    try {
      const availableVoices = synthesisRef.current.getVoices();
      setVoices(availableVoices);
      const britishVoice = availableVoices.find(
        (voice) => voice.lang === 'en-GB' || voice.name.includes('British'),
      );
      setSelectedVoice((current) => current || britishVoice || availableVoices[0]);
    } catch {
      setError('Text-to-speech voices could not be loaded.');
    }
  }, []);

  const speakWord = useCallback((word, voiceOverride = null) => {
    if (!word) return;
    try {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.voice = voiceOverride || selectedVoice || null;
      utterance.onerror = () => setError('The word could not be played.');
      synthesisRef.current.speak(utterance);
    } catch {
      setError('Text-to-speech is unavailable in this browser.');
    }
  }, [volume, rate, pitch, selectedVoice]);

  const selectWeightedRandomWord = useCallback((wordList) => {
    if (!wordList?.length) return;
    let availableWords = wordList.filter((word) => !usedWords.includes(word.word));
    if (!availableWords.length) {
      setUsedWords([]);
      availableWords = wordList;
    }
    const totalScore = availableWords.reduce((sum, word) => sum + Math.max(word.score, 1), 0);
    let randomScore = Math.random() * totalScore;
    for (const word of availableWords) {
      randomScore -= Math.max(word.score, 1);
      if (randomScore <= 0) {
        setCurrentWord(word.word);
        setUsedWords((previous) => [...previous, word.word]);
        setFeedback(null);
        break;
      }
    }
  }, [usedWords]);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/words`);
      setWords(response.data);
      selectWeightedRandomWord(response.data);
    } catch {
      setError('We could not load your word list. Check the server and try again.');
    } finally {
      setLoading(false);
    }
  };

  const giveHint = () => {
    if (!currentWord) return;
    const availableIndices = currentWord
      .split('')
      .map((_, index) => index)
      .filter((index) => !hint.includes(index));
    if (availableIndices.length) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      setHint((previous) => [...previous, availableIndices[randomIndex]]);
      setFeedback('hint');
    }
  };

  const displayHint = () => currentWord
    .split('')
    .map((letter, index) => (hint.includes(index) ? letter : '•'))
    .join(' ');

  const checkWord = async () => {
    if (!currentWord || !input.trim()) return;
    if (input.trim().toLowerCase() === currentWord.trim().toLowerCase()) {
      setScore((previous) => previous + 1);
      setShowWord(true);
      setFeedback('correct');
      const scoreAdjustment = firstAttempt ? -5 : hint.length;
      setFirstAttempt(true);
      try {
        await axios.post(`${API_URL}/words/check`, { word: currentWord, scoreAdjustment });
      } catch {
        setError('Your answer was correct, but progress could not be saved.');
      }
      setInput('');
      setHint([]);
      setAttempts((previous) => previous + 1);
      showWordTimeoutRef.current = setTimeout(() => {
        setShowWord(false);
        selectWeightedRandomWord(words);
      }, 1800);
    } else {
      giveHint();
      setFeedback('incorrect');
      setFirstAttempt(false);
      setAttempts((previous) => previous + 1);
    }
  };

  const nextWord = () => {
    setInput('');
    setHint([]);
    setShowWord(false);
    setFirstAttempt(true);
    selectWeightedRandomWord(words);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeWord = async () => {
    if (!currentWord) return;
    try {
      await axios.delete(`${API_URL}/words/${currentWord}`);
      const updatedWords = words.filter((word) => word.word !== currentWord);
      setWords(updatedWords);
      setUsedWords((previous) => previous.filter((word) => word !== currentWord));
      setInput('');
      setHint([]);
      selectWeightedRandomWord(updatedWords);
    } catch {
      setError('This word could not be removed.');
    }
  };

  const handleVoiceChange = (event) => {
    const voice = voices.find((item) => item.name === event.target.value);
    setSelectedVoice(voice);
    speakWord(currentWord, voice);
  };

  useEffect(() => {
    fetchWords();
    populateVoiceList();
    synthesisRef.current.onvoiceschanged = populateVoiceList;
    return () => {
      synthesisRef.current.cancel();
      clearTimeout(showWordTimeoutRef.current);
    };
  }, [populateVoiceList]);

  useEffect(() => {
    if (currentWord) speakWord(currentWord);
  }, [currentWord]);

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-mark"><Headphones size={28} /></div>
        <p>Preparing your practice…</p>
      </main>
    );
  }

  const progress = words.length ? Math.min((score / words.length) * 100, 100) : 0;
  const accuracy = attempts ? Math.round((score / attempts) * 100) : 0;

  return (
    <main className="app-shell">
      <header className="topbar dashboard-topbar">
        <a className="brand" href="/" aria-label="Typelearner home">
          <span className="brand-mark"><Headphones size={20} /></span>
          <span>type<span>learner</span></span>
        </a>
        <nav className="top-nav">
          <a href="/" aria-current="page">Practice</a>
          <a href="/dashboard">Words</a>
        </nav>
      </header>

      <section className="practice-layout">
        <div className="practice-column">
          <h1>Listening practice</h1>
          <p className="lede">Listen to the word, then type what you hear.</p>

          <section className={`practice-card ${feedback === 'correct' ? 'is-correct' : ''}`}>
            <div className="card-meta">
              <span>Word {Math.min(usedWords.length, words.length)} of {words.length}</span>
              <span>{currentWord.length} letters</span>
            </div>

            <button className="listen-button" onClick={() => speakWord(currentWord)} aria-label="Play the current word">
              <span className="sound-ring"><Volume2 size={27} /></span>
              <span><strong>Play word</strong><small>Listen as many times as you need</small></span>
            </button>

            <label className="answer-label" htmlFor="answer">Your answer</label>
            <div className="answer-row">
              <input
                ref={inputRef}
                id="answer"
                type="text"
                value={input}
                onChange={(event) => { setInput(event.target.value); setFeedback(null); }}
                onKeyDown={(event) => event.key === 'Enter' && checkWord()}
                placeholder="Type the word…"
                autoComplete="off"
                spellCheck="false"
                aria-describedby="answer-feedback"
              />
              <button className="submit-button" onClick={checkWord} disabled={!input.trim()}>
                Check <ArrowRight size={18} />
              </button>
            </div>

            <div id="answer-feedback" className={`feedback ${feedback || ''}`} aria-live="polite">
              {feedback === 'correct' && <><Check size={17} /> Perfect — that’s exactly right.</>}
              {feedback === 'incorrect' && <>Not quite. One letter has been revealed for you.</>}
              {!feedback && hint.length === 0 && <>Press Enter to check your answer</>}
            </div>

            {(hint.length > 0 || showWord) && (
              <div className="word-reveal">
                <span>{showWord ? 'Correct answer' : 'Your hint'}</span>
                <strong>{showWord ? currentWord : displayHint()}</strong>
              </div>
            )}

            <div className="card-actions">
              <button onClick={giveHint}><Lightbulb size={17} /> Reveal a letter</button>
              <button onClick={nextWord}><RotateCcw size={17} /> Skip word</button>
              <button className="danger-action" onClick={removeWord}><Trash2 size={17} /> Remove</button>
            </div>
          </section>
        </div>

        <aside className="side-column">
          <section className="progress-card">
            <div className="section-heading">
              <div><strong>Progress</strong></div>
              <span className="score-badge">{score}</span>
            </div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <div className="stats-grid">
              <div><strong>{score}</strong><span>Correct</span></div>
              <div><strong>{attempts}</strong><span>Attempts</span></div>
              <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
            </div>
          </section>

          <section className="settings-card">
            <div className="section-title"><Settings2 size={18} /><div><strong>Audio settings</strong><span>Make the voice comfortable</span></div></div>
            {[
              { label: 'Volume', value: volume, set: setVolume, min: 0, max: 1, step: 0.01 },
              { label: 'Speed', value: rate, set: setRate, min: 0.5, max: 1.5, step: 0.1 },
              { label: 'Pitch', value: pitch, set: setPitch, min: 0, max: 2, step: 0.1 },
            ].map((control) => (
              <label className="range-control" key={control.label}>
                <span>{control.label}<output>{control.value.toFixed(1)}×</output></span>
                <input type="range" min={control.min} max={control.max} step={control.step} value={control.value} onChange={(event) => control.set(Number(event.target.value))} />
              </label>
            ))}
            <label className="voice-control">
              <span>Voice</span>
              <select value={selectedVoice?.name || ''} onChange={handleVoiceChange}>
                {voices.length ? voices.map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name} · {voice.lang}</option>) : <option>Default browser voice</option>}
              </select>
            </label>
          </section>

        </aside>
      </section>

      {error && <button className="toast" onClick={() => setError(null)}>{error}<span>Dismiss</span></button>}
    </main>
  );
};

export default App;
