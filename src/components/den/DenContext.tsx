import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { get, set } from "idb-keyval";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZoneId = "echo" | "reel" | "folio" | "nook";

export interface Movie {
  id: string;
  title: string;
  year: string;
  genre: string;
  director: string;
  plot: string;
  posterUrl: string | null;
  addedAt: string;
}

export interface WatchedMovie extends Movie {
  watchedAt: string;
  rating: number;
  note: string;
  webInspo: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number;
  currentPage: number;
  readingNotes: string;
  addedAt: string;
}

export interface ReadBook extends Book {
  startedAt: string;
  finishedAt: string;
  rating: number;
  favouriteQuote: string;
  webInspo: string[];
}

export interface Save {
  id: string;
  type: "track" | "movie" | "book" | "quote";
  label: string;
  sublabel: string;
  imageUrl?: string;
  savedAt: string;
  sourceZone: "echo" | "reel" | "folio";
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  morningIntentions: string;
  eveningReflection: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  duration: number;
  progress: number;
  isPlaying: boolean;
}

export interface LoggedTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  contextTag: string; // e.g. "3am", "studying"
  addedAt: string;
}

export interface DenState {
  activeZone: ZoneId | null;

  // ECHO
  spotifyPlaylistUrl: string | null;

  // REEL
  watchlist: Movie[];
  watched: WatchedMovie[];

  // FOLIO
  currentlyReading: Book | null;
  wantToRead: Book[];
  readLog: ReadBook[];

  // NOOK
  saves: Save[];
  nookNotes: string;
  journals: JournalEntry[];
  pomodoroActive: boolean;
  pomodoroTimeLeft: number;
}

// ─── Persisted subset (exclude volatile spotify state) ────────────────────────

interface PersistedState {
  spotifyPlaylistUrl: string | null;
  watchlist: Movie[];
  watched: WatchedMovie[];
  currentlyReading: Book | null;
  wantToRead: Book[];
  readLog: ReadBook[];
  saves: Save[];
  nookNotes: string;
  journals: JournalEntry[];
}

const STORAGE_KEY = "den_state_v1";

// ─── Initial state ────────────────────────────────────────────────────────────

function createInitialState(): DenState {
  return {
    activeZone: null,
    spotifyPlaylistUrl: null,
    watchlist: [],
    watched: [],
    currentlyReading: null,
    wantToRead: [],
    readLog: [],
    saves: [],
    nookNotes: "",
    journals: [],
    pomodoroActive: false,
    pomodoroTimeLeft: 25 * 60,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DenActions {
  setActiveZone: (zone: ZoneId | null) => void;

  // ECHO
  setSpotifyPlaylistUrl: (url: string | null) => void;

  // REEL
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (id: string) => void;
  markWatched: (id: string, data: Omit<WatchedMovie, keyof Movie>) => void;
  updateWatched: (id: string, update: Partial<WatchedMovie>) => void;
  removeWatched: (id: string) => void;

  // FOLIO
  setCurrentlyReading: (book: Book) => void;
  updateCurrentlyReading: (update: Partial<Book>) => void;
  finishCurrentlyReading: (data: Omit<ReadBook, keyof Book>) => void;
  addToWantToRead: (book: Book) => void;
  removeFromWantToRead: (id: string) => void;
  startReading: (id: string) => void;
  updateReadLog: (id: string, update: Partial<ReadBook>) => void;
  removeFromReadLog: (id: string) => void;

  // NOOK
  addSave: (save: Save) => void;
  removeSave: (id: string) => void;
  setNookNotes: (notes: string) => void;
  updateJournal: (date: string, update: Partial<JournalEntry>) => void;
  startPomodoro: () => void;
  stopPomodoro: () => void;
  tickPomodoro: () => void;
}

const DenContext = createContext<(DenState & DenActions) | null>(null);

export function useDen() {
  const ctx = useContext(DenContext);
  if (!ctx) throw new Error("useDen must be used inside DenProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DenState>(createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    get<PersistedState>(STORAGE_KEY)
      .then((persisted) => {
        if (persisted) {
          setState((s) => ({
            ...s,
            spotifyPlaylistUrl: persisted.spotifyPlaylistUrl ?? null,
            watchlist: persisted.watchlist ?? [],
            watched: persisted.watched ?? [],
            currentlyReading: persisted.currentlyReading ?? null,
            wantToRead: persisted.wantToRead ?? [],
            readLog: persisted.readLog ?? [],
            saves: persisted.saves ?? [],
            nookNotes: persisted.nookNotes ?? "",
            journals: persisted.journals ?? [],
          }));
        }
        setIsHydrated(true);
      })
      .catch(console.error);
  }, []);

  // Debounced persist
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHydrated) return; // Don't overwrite with empty state before load

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      set(STORAGE_KEY, {
        spotifyPlaylistUrl: state.spotifyPlaylistUrl,
        watchlist: state.watchlist,
        watched: state.watched,
        currentlyReading: state.currentlyReading,
        wantToRead: state.wantToRead,
        readLog: state.readLog,
        saves: state.saves,
        nookNotes: state.nookNotes,
        journals: state.journals,
      }).catch(console.error);
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    state.spotifyPlaylistUrl,
    state.watchlist,
    state.watched,
    state.currentlyReading,
    state.wantToRead,
    state.readLog,
    state.saves,
    state.nookNotes,
    state.journals,
    isHydrated,
  ]);

  // Pomodoro Tick
  useEffect(() => {
    if (!state.pomodoroActive) return;
    const interval = setInterval(() => {
      setState((s) => {
        if (!s.pomodoroActive) return s;
        const newTime = s.pomodoroTimeLeft - 1;
        if (newTime <= 0) {
          // Play a sound or notification here eventually
          return { ...s, pomodoroActive: false, pomodoroTimeLeft: 0 };
        }
        return { ...s, pomodoroTimeLeft: newTime };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.pomodoroActive]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const setActiveZone = useCallback((zone: ZoneId | null) => {
    setState((s) => ({ ...s, activeZone: zone }));
  }, []);

  // ECHO
  const setSpotifyPlaylistUrl = useCallback((url: string | null) => {
    setState((s) => ({ ...s, spotifyPlaylistUrl: url }));
  }, []);

  // REEL
  const addToWatchlist = useCallback((movie: Movie) => {
    setState((s) => ({ ...s, watchlist: [...s.watchlist, movie] }));
  }, []);
  const removeFromWatchlist = useCallback((id: string) => {
    setState((s) => ({ ...s, watchlist: s.watchlist.filter((m) => m.id !== id) }));
  }, []);
  const markWatched = useCallback((id: string, data: Omit<WatchedMovie, keyof Movie>) => {
    setState((s) => {
      const movie = s.watchlist.find((m) => m.id === id);
      if (!movie) return s;
      return {
        ...s,
        watchlist: s.watchlist.filter((m) => m.id !== id),
        watched: [...s.watched, { ...movie, ...data }],
      };
    });
  }, []);
  const updateWatched = useCallback((id: string, update: Partial<WatchedMovie>) => {
    setState((s) => ({
      ...s,
      watched: s.watched.map((m) => (m.id === id ? { ...m, ...update } : m)),
    }));
  }, []);
  const removeWatched = useCallback((id: string) => {
    setState((s) => ({ ...s, watched: s.watched.filter((m) => m.id !== id) }));
  }, []);

  // FOLIO
  const setCurrentlyReading = useCallback((book: Book) => {
    setState((s) => ({ ...s, currentlyReading: book }));
  }, []);
  const updateCurrentlyReading = useCallback((update: Partial<Book>) => {
    setState((s) => ({
      ...s,
      currentlyReading: s.currentlyReading ? { ...s.currentlyReading, ...update } : null,
    }));
  }, []);
  const finishCurrentlyReading = useCallback((data: Omit<ReadBook, keyof Book>) => {
    setState((s) => {
      if (!s.currentlyReading) return s;
      return {
        ...s,
        currentlyReading: null,
        readLog: [...s.readLog, { ...s.currentlyReading, ...data }],
      };
    });
  }, []);
  const addToWantToRead = useCallback((book: Book) => {
    setState((s) => ({ ...s, wantToRead: [...s.wantToRead, book] }));
  }, []);
  const removeFromWantToRead = useCallback((id: string) => {
    setState((s) => ({ ...s, wantToRead: s.wantToRead.filter((b) => b.id !== id) }));
  }, []);
  const startReading = useCallback((id: string) => {
    setState((s) => {
      const book = s.wantToRead.find((b) => b.id === id);
      if (!book) return s;
      return {
        ...s,
        wantToRead: s.wantToRead.filter((b) => b.id !== id),
        currentlyReading: book,
      };
    });
  }, []);
  const updateReadLog = useCallback((id: string, update: Partial<ReadBook>) => {
    setState((s) => ({
      ...s,
      readLog: s.readLog.map((b) => (b.id === id ? { ...b, ...update } : b)),
    }));
  }, []);
  const removeFromReadLog = useCallback((id: string) => {
    setState((s) => ({ ...s, readLog: s.readLog.filter((b) => b.id !== id) }));
  }, []);

  // NOOK
  const addSave = useCallback((save: Save) => {
    setState((s) => ({ ...s, saves: [...s.saves, save] }));
  }, []);
  const removeSave = useCallback((id: string) => {
    setState((s) => ({ ...s, saves: s.saves.filter((sv) => sv.id !== id) }));
  }, []);
  const setNookNotes = useCallback((notes: string) => {
    setState((s) => ({ ...s, nookNotes: notes }));
  }, []);
  const updateJournal = useCallback((date: string, update: Partial<JournalEntry>) => {
    setState((s) => {
      const existing = s.journals.find((j) => j.date === date);
      if (existing) {
        return {
          ...s,
          journals: s.journals.map((j) => (j.date === date ? { ...j, ...update } : j)),
        };
      }
      return {
        ...s,
        journals: [
          ...s.journals,
          { date, morningIntentions: "", eveningReflection: "", ...update },
        ],
      };
    });
  }, []);
  const startPomodoro = useCallback(() => {
    setState((s) => ({ ...s, pomodoroActive: true, pomodoroTimeLeft: 25 * 60 }));
  }, []);
  const stopPomodoro = useCallback(() => {
    setState((s) => ({ ...s, pomodoroActive: false, pomodoroTimeLeft: 25 * 60 }));
  }, []);
  const tickPomodoro = useCallback(() => {
    setState((s) => {
      if (!s.pomodoroActive) return s;
      const newTime = s.pomodoroTimeLeft - 1;
      if (newTime <= 0) {
        return { ...s, pomodoroActive: false, pomodoroTimeLeft: 0 };
      }
      return { ...s, pomodoroTimeLeft: newTime };
    });
  }, []);

  const value = {
    ...state,
    setActiveZone,
    setSpotifyPlaylistUrl,
    addToWatchlist,
    removeFromWatchlist,
    markWatched,
    updateWatched,
    removeWatched,
    setCurrentlyReading,
    updateCurrentlyReading,
    finishCurrentlyReading,
    addToWantToRead,
    removeFromWantToRead,
    startReading,
    updateReadLog,
    removeFromReadLog,
    addSave,
    removeSave,
    setNookNotes,
    updateJournal,
    startPomodoro,
    stopPomodoro,
    tickPomodoro,
  };

  return <DenContext.Provider value={value}>{children}</DenContext.Provider>;
}
