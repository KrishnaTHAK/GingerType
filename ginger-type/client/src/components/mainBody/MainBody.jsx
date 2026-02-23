import "./MainBody.css";
import { textData } from "../../utils/textData.js";
import { useState, useMemo, useCallback } from "react";
import TextContainer from "./MainComponent/TextContainer.jsx";
import Difficulty from "./MainComponent/Difficulty.jsx";
import TestDuration from "./MainComponent/TestDuration.jsx";
import History from "./MainComponent/History.jsx";
import TextSelection from "./MainComponent/TextSelection.jsx";

function MainBody({ restartSignal }) {
    const [textType, setTextType] = useState("classicLiterature");
    const [difficulty, setDifficulty] = useState("easy");
    const [duration, setDuration] = useState(60);

    // 1. Define the arrays for cycling
    const categories = Object.keys(textData); 
    const difficultyLevels = ["easy", "medium", "hard"];

    // 2. Add the cycling handlers
    const cycleCategory = useCallback(() => {
        setTextType((prev) => {
            const currentIndex = categories.indexOf(prev);
            const nextIndex = (currentIndex + 1) % categories.length;
            return categories[nextIndex];
        });
    }, [categories]);

    const cycleDifficulty = useCallback(() => {
        setDifficulty((prev) => {
            const currentIndex = difficultyLevels.indexOf(prev);
            const nextIndex = (currentIndex + 1) % difficultyLevels.length;
            return difficultyLevels[nextIndex];
        });
    }, [difficultyLevels]);

    const selectedText = useMemo(() => {
        const text = textData[textType];
        if (!text) return "";
        const match = text.find((t) => t.difficulty === difficulty);
        return match?.content || "";
    }, [textType, difficulty]);

    return (
        <main>
            <TextContainer
                text={selectedText}
                durationSeconds={duration}
                restartSignal={restartSignal}
                onCycleCategory={cycleCategory}
                onCycleDifficulty={cycleDifficulty}
            />
            
            <div className="settings-sidebar">
                <TestDuration duration={duration} setDuration={setDuration} />
                <Difficulty difficulty={difficulty} setDifficulty={setDifficulty} />
                <TextSelection textType={textType} setTextType={setTextType} />
                <History />
            </div>
        </main>
    );
}

export default MainBody;