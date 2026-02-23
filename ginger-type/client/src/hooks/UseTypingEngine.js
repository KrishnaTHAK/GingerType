// src/hooks/useTypingEngine.js
import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export function useTypingEngine(text, durationSeconds, restartSignal) {
    // --- Derived data ---
    const characters = useMemo(() => (text ? text.split("") : []), [text]);
    const words = useMemo(() => {
        if (!text) return [];
        return text.split(" ").map((w, i, arr) => (i < arr.length - 1 ? w + " " : w));
    }, [text]);

    // --- Core Engine Refs ---
    const typedCharsRef = useRef([]); 
    const cursorRef = useRef(0); 
    const charNodesRef = useRef([]); 
    const containerRef = useRef(null);

    // --- State & Snapshot ---
    const rafRef = useRef(null);
    const [snapshot, setSnapshot] = useState({
        cursor: 0,
        typed: [],
        wpm: 0,
        accuracy: 100,
        timeLeft: durationSeconds,
    });

    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false);
    const pauseStartTimeRef = useRef(null); 
    const [showResultModal, setShowResultModal] = useState(false);

    // --- Scroll & Timer Refs ---
    const scrollEnabledRef = useRef(false);
    const prevAbsLineRef = useRef(0);
    const isRunningRef = useRef(false);
    const testEndedRef = useRef(false);
    const startTimeRef = useRef(null); 
    const timerIntervalRef = useRef(null); 
    const resettingRef = useRef(false);

    
    const computeMetrics = useCallback((typedArr, nowMs) => {
        const typedCount = typedArr.length;
        let correctCount = 0;
        for (let i = 0; i < typedArr.length && i < characters.length; ++i) {
            if (typedArr[i] === characters[i]) correctCount++;
        }

        let elapsedSeconds = 0;
        if (isRunningRef.current && startTimeRef.current) {
            elapsedSeconds = Math.max(0.001, (nowMs - startTimeRef.current) / 1000);
        } else if (startTimeRef.current) {
            elapsedSeconds = Math.max(0.001, (Date.now() - startTimeRef.current) / 1000);
        } else {
            elapsedSeconds = 0.001;
        }

        const wpm = elapsedSeconds > 0 ? (correctCount / 5) * (60 / elapsedSeconds) : 0;
        const accuracy = typedCount === 0 ? 100 : (correctCount / typedCount) * 100;

        return {
            wpm: Math.max(0, Math.round(wpm)),
            accuracy: Math.max(0, Math.round(accuracy)),
        };
    }, [characters]);

    // ---------- Sync Data to UI ----------
    const scheduleSync = useCallback(() => {
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const now = Date.now();

            let timeLeft = durationSeconds;
            if (isRunningRef.current && startTimeRef.current) {
                const elapsed = Math.floor((now - startTimeRef.current) / 1000);
                timeLeft = Math.max(0, durationSeconds - elapsed);
            } else {
                timeLeft = durationSeconds;
            }

            const metrics = computeMetrics(typedCharsRef.current, now);
            setSnapshot({
                cursor: cursorRef.current,
                typed: typedCharsRef.current.slice(),
                wpm: metrics.wpm,
                accuracy: metrics.accuracy,
                timeLeft,
            });

            if (isRunningRef.current && timeLeft <= 0) {
                isRunningRef.current = false;
                testEndedRef.current = true;
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                }
                setShowResultModal(true);
            }
        });
    }, [computeMetrics, durationSeconds]);
    // ---------- Reset Engine ----------
    const resetEngine = useCallback(() => {
        if (resettingRef.current) return;
        resettingRef.current = true;

        setShowResultModal(false); 
        
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        typedCharsRef.current = [];
        cursorRef.current = 0;
        scrollEnabledRef.current = false;
        prevAbsLineRef.current = 0;
        isRunningRef.current = false;
        testEndedRef.current = false;
        startTimeRef.current = null;

        if (containerRef.current) containerRef.current.scrollTop = 0;

        requestAnimationFrame(() => {
            scheduleSync();
            resettingRef.current = false;
        });
    }, [scheduleSync]);

    // ---------- Pause Logic ----------
    const togglePause = useCallback(() => {
        if (testEndedRef.current) return;

        if (!isPausedRef.current) {
            isPausedRef.current = true;
            setIsPaused(true);
            isRunningRef.current = false;
            pauseStartTimeRef.current = Date.now();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        } else {
            isPausedRef.current = false;
            setIsPaused(false);
            isRunningRef.current = true;
            
            const pauseDuration = Date.now() - pauseStartTimeRef.current;
            startTimeRef.current += pauseDuration;

            timerIntervalRef.current = setInterval(() => {
                scheduleSync();
            }, 300);
        }
    }, [scheduleSync]);

    // ---------- Keyboard Handler ----------
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 1. pause the test
            if (e.key === "Escape") {
                togglePause();
                return;
            }
            // 2. 
            if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                resetEngine();
                return;
            }
            // 3. Ctrl + Shift + P: Toggle Mode
            if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
                e.preventDefault();
                // onCycleCategory();
                return;
            }

            // 4. Shift + D: Change Difficulty
            if (e.shiftKey && (e.key === "D" || e.key === "d")) {
                e.preventDefault();
                // onCycleDifficulty();
                return;
            }
            
            if (isPausedRef.current || testEndedRef.current) return;
            
            if (!isRunningRef.current && e.key !== "Backspace" && e.key.length === 1) {
                isRunningRef.current = true;
                testEndedRef.current = false;
                startTimeRef.current = Date.now();

                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = setInterval(() => {
                    scheduleSync();
                }, 300);
            }

            if (e.key === "Backspace") {
                e.preventDefault();
                if (typedCharsRef.current.length > 0) {
                    typedCharsRef.current.pop();
                }
                cursorRef.current = Math.max(0, cursorRef.current - 1);
                scheduleSync();
                return;
            }

            if (e.key.length !== 1) return;
            if (cursorRef.current >= characters.length) return;

            const expected = characters[cursorRef.current];
            const pressed = e.key;

            if (expected === " " && pressed !== " ") {
                typedCharsRef.current.push("_");
            } else {
                typedCharsRef.current.push(pressed);
            }

            cursorRef.current = Math.min(cursorRef.current + 1, characters.length);
            scheduleSync();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [characters.length, scheduleSync, characters, togglePause]); // Added togglePause dependency

    
    useEffect(() => {
        if (snapshot.timeLeft === 0 && !showResultModal) {
            requestAnimationFrame(() => setShowResultModal(true));
            requestAnimationFrame(() => resetEngine());
        }
    }, [snapshot.timeLeft, showResultModal]);

    // ---------- Scroll Effect ----------
    useEffect(() => {
        const container = containerRef.current;
        const activeIdx = snapshot.cursor;
        const activeNode = charNodesRef.current[activeIdx];
        if (!container || !activeNode) return;

        const lineHeight = Math.max(1, activeNode.offsetHeight || 1);
        const absLine = Math.floor(activeNode.offsetTop / lineHeight);
        const prevAbs = prevAbsLineRef.current;

        if (!scrollEnabledRef.current) {
            if (prevAbs === 1 && absLine === 2) {
                scrollEnabledRef.current = true;
                container.scrollTop = Math.max(0, container.scrollTop + lineHeight);
            }
            prevAbsLineRef.current = absLine;
            return;
        }

        if (absLine > prevAbs) {
            container.scrollTop = container.scrollTop + (absLine - prevAbs) * lineHeight;
        } else if (absLine < prevAbs) {
            container.scrollTop = Math.max(0, container.scrollTop - (prevAbs - absLine) * lineHeight);
        }

        prevAbsLineRef.current = absLine;
    }, [snapshot.cursor, snapshot.typed, characters.length]);


    // ---------- External Triggers ----------
    useEffect(() => {
        if (restartSignal === 0) return;
        requestAnimationFrame(() => resetEngine());
    }, [restartSignal, resetEngine]);

    useEffect(() => {
        requestAnimationFrame(() => resetEngine());
    }, [durationSeconds, resetEngine]);

    // ---------- Status Matrix ----------
    const statuses = useMemo(() => {
        const s = new Array(characters.length).fill("pending");
        const typed = snapshot.typed || [];
        for (let i = 0; i < characters.length; ++i) {
            if (i === snapshot.cursor) s[i] = "active";
            else if (i < typed.length) s[i] = typed[i] === characters[i] ? "correct" : "incorrect";
            else s[i] = "pending";
        }
        return s;
    }, [snapshot, characters]);

    const setCharNode = useCallback((index, node) => {
        charNodesRef.current[index] = node;
    }, []);

    // Return everything the UI needs to render
    return {
        words,
        snapshot,
        statuses,
        isPaused,
        showResultModal,
        setShowResultModal,
        resetEngine,
        containerRef,
        setCharNode
    };
}