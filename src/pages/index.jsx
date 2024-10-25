/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';


const App = () => {
  // State management
  const [words, setWords] = useState([]);
  const [, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [, setShowConfetti] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [firstAttempt, setFirstAttempt] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs
  const showWordTimeoutRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const inputRef = useRef(null);

  // Initialize voices
  const populateVoiceList = useCallback(() => {
    try {
      const availableVoices = synthesisRef.current.getVoices();
      setVoices(availableVoices);
      
      const britishVoice = availableVoices.find(
        voice => voice.lang === 'en-GB' || voice.name.includes('British')
      );
      setSelectedVoice(britishVoice || availableVoices[0]);
    } catch (error) {
      console.error('Error loading voices:', error);
      setError('Failed to load text-to-speech voices');
    }
  }, []);

  // Speech synthesis

  // Fetch words from API
  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://typelearner.onrender.com/words`);
      setWords(response.data);
      selectWeightedRandomWord(response.data);
    } catch (error) {
      console.error('Error fetching words:', error);
      setError('Failed to fetch words from the server');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Check word correctness
  const checkWord = async () => {
    if (!currentWord) return;

    if (input.trim().toLowerCase() === currentWord.trim().toLowerCase()) {
      setScore(prevScore => prevScore + 1);
      setShowConfetti(true);
      setShowWord(true);
      const scoreAdjustment = firstAttempt ? -5 : hint.length;
      setFirstAttempt(true);

      try {
        await axios.post(`https://typelearner.onrender.com/check`, {
          word: currentWord,
          scoreAdjustment,
        });
      } catch (error) {
        console.error('Error updating word:', error);
        setError('Failed to update word score');
      }

      setInput('');
      setHint([]);
      setAttempts(prevAttempts => prevAttempts + 1);

      showWordTimeoutRef.current = setTimeout(() => {
        setShowConfetti(false);
        setShowWord(false);
        selectWeightedRandomWord(words);
      }, 2000);
    } else {
      giveHint();
      setFirstAttempt(false);
      setAttempts(prevAttempts => prevAttempts + 1);
    }
  };
  const speakWord = useCallback((word, voiceOverride = null) => {
    if (!word) return;

    try {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;
      
      // Use voice override if provided, otherwise use selected voice
      const voiceToUse = voiceOverride || selectedVoice;
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError('Failed to speak the word');
      };

      synthesisRef.current.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setError('Failed to initialize speech synthesis');
    }
  }, [volume, rate, pitch, selectedVoice]);
  // Move to next word
  const nextWord = useCallback(() => {
    setInput('');
    setHint([]);
    setShowWord(true);
    setFirstAttempt(true);
    
    showWordTimeoutRef.current = setTimeout(() => {
      setShowWord(false);
      selectWeightedRandomWord(words);
    }, 4000);
  }, [words]);

  // Provide hint
  const giveHint = () => {
    const availableIndices = currentWord
      .split('')
      .map((letter, index) => index)
      .filter(index => !hint.includes(index));

    if (availableIndices.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const newHint = [...hint, availableIndices[randomIndex]];
      setHint(newHint);
    }
  };

  // Select random word based on weights
  const selectWeightedRandomWord = (wordList) => {
    if (!wordList?.length) return;

    const availableWords = wordList.filter(word => !usedWords.includes(word.word));

    if (availableWords.length === 0) {
      setError('No more words available');
      return;
    }

    const totalScore = availableWords.reduce((sum, word) => sum + word.score, 0);
    let randomScore = Math.random() * totalScore;

    for (let i = 0; i < availableWords.length; i++) {
      randomScore -= availableWords[i].score;
      if (randomScore <= 0) {
        const selectedWord = availableWords[i].word;
        setCurrentWordIndex(wordList.findIndex(word => word.word === selectedWord));
        setCurrentWord(selectedWord);
        setUsedWords(prevUsedWords => [...prevUsedWords, selectedWord]);
        break;
      }
    }
  };

  // Display current hint
  const displayHint = () => {
    if (!currentWord) return '';
    return currentWord
      .split('')
      .map((letter, index) => (hint.includes(index) ? letter : '_'))
      .join('');
  };

  // Remove word from list
  const removeWord = async () => {
    try {
      await axios.delete(`https://typelearner.onrender.com/words/${currentWord}`);
      const updatedWords = words.filter(word => word.word !== currentWord);
      setWords(updatedWords);
      setUsedWords((prevUsedWords) => prevUsedWords.filter(word => word !== currentWord));
      setInput('');
      setHint([]);
      selectWeightedRandomWord(updatedWords);
    } catch (error) {
      console.error('Error removing word:', error);
      setError('Failed to remove word');
    }
  };

  // Handle voice selection


  // Initialize component
  useEffect(() => {
    fetchWords();
    populateVoiceList();
    synthesisRef.current.onvoiceschanged = populateVoiceList;

    return () => {
      synthesisRef.current.cancel();
      if (showWordTimeoutRef.current) {
        clearTimeout(showWordTimeoutRef.current);
      }
    };
  }, [populateVoiceList]);
  useEffect(() => {
    if (currentWord && selectedVoice) {
      speakWord(currentWord);
    }
  }, [currentWord, speakWord]); 

  // Speak word when it changes
  useEffect(() => {
    if (currentWord) {
      speakWord(currentWord);
    }
  }, [currentWord, selectedVoice, volume, rate, pitch, speakWord]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }


  // Modified handle voice change
  const handleVoiceChange = (e) => {
    const selectedVoiceName = e.target.value;
    const newVoice = voices.find(voice => voice.name === selectedVoiceName);
    
    if (currentWord && newVoice) {
      // Speak immediately with the new voice
      speakWord(currentWord, newVoice);
    }
    
    // Update the selected voice state after speaking
    setSelectedVoice(newVoice);
  };

  // Modified useEffect for speaking word changes
 

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              IELTS Listening Score Checker
            </h1>
          </div>
          
          <div className="space-y-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-3 w-full max-w-md">
                  <label className="font-medium text-gray-700 min-w-[120px] text-right">
                    Enter the word:
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && checkWord()}
                    className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    { label: "Submit", onClick: checkWord },
                    { label: "Hear Again", onClick: () => speakWord(currentWord) },
                    { label: "Give a Hint", onClick: giveHint },
                    { label: "Next", onClick: nextWord },
                    { label: "Remove Word", onClick: removeWord }
                  ].map((button) => (
                    <button
                      key={button.label}
                      onClick={button.onClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
                
                <p className="text-gray-600 italic mt-4">
                  Hint: {displayHint()}
                </p>
              </div>
            </div>

            {/* Score Section */}
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-blue-600">
                Score: {score}
              </p>
              <p className="text-gray-600">
                Attempts: {attempts}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${(score / words.length) * 100}%` }}
              />
            </div>

            {/* Current Word Display */}
            {showWord && (
              <div className="text-center py-4">
                <span className="font-bold text-6xl text-gray-800">
                  {currentWord}
                </span>
              </div>
            )}

            {/* Speech Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-lg">
              {[
                {
                  label: "Volume",
                  value: volume,
                  onChange: setVolume,
                  min: "0",
                  max: "1",
                  step: "0.01"
                },
                {
                  label: "Speed",
                  value: rate,
                  onChange: setRate,
                  min: "0.1",
                  max: "2",
                  step: "0.1"
                },
                {
                  label: "Pitch",
                  value: pitch,
                  onChange: setPitch,
                  min: "0",
                  max: "2",
                  step: "0.1"
                }
              ].map((control) => (
                <div key={control.label} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {control.label}
                  </label>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={control.value}
                    onChange={(e) => control.onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Voice
                </label>
                <select 
      onChange={handleVoiceChange}
      value={selectedVoice?.name || ''}
      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    >
      {voices.length === 0 ? (
        <option value="">Loading voices...</option>
      ) : (
        voices.map((voice) => (
          <option key={voice.name} value={voice.name}>
            {voice.name} ({voice.lang})
          </option>
        ))
      )}
    </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ score, total }) => {
  const progress = (score / total) * 100;
  return (
    <div className="progress-bar ">
      <div className="progress" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

export default App;
