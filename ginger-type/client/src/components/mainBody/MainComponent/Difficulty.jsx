import '../MainBody.css';

function Difficulty({
    difficulty,
    setDifficulty
}) {
    return (
        <div className="difficulty">
        <button
            className={difficulty === 'easy' ? 'active' : ''}
            onClick={() => setDifficulty('easy')}
        >
            Easy
        </button>

        <button
            className={difficulty === 'medium' ? 'active' : ''}
            onClick={() => setDifficulty('medium')}
        >
            Medium
        </button>

        <button
            className={difficulty === 'hard' ? 'active' : ''}
            onClick={() => setDifficulty('hard')}
        >
            Hard
        </button>
        </div>
    )
}

export default Difficulty;