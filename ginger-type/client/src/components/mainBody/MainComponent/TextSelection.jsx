import '../MainBody.css';

const TEXT_TYPES = [
    { label: 'Classic Literature', value: 'classicLiterature'},
    { label: 'News Article', value: 'newsArticle'},
    { label: 'Technical Text', value: 'technicalText'},
    { label: 'Random Word Clouds', value: 'randomWordClouds'},
];

function TextSelection({
    textType,
    setTextType
}) {
    return (
        <div className="settings-choose-text">
            <span>Choose Text :</span>
            
            <ul className="text-list">
                {TEXT_TYPES.map(({ label, value }) => (
                    <li
                        key={value}
                        className={textType === value ? "active" : ""}
                        onClick={() => setTextType(value)}
                    >
                    {label}
                </li>
                ))}
            </ul>
        </div>
    );
}

export default TextSelection;