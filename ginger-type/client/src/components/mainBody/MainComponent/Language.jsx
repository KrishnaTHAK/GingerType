import '../MainBody.css';

function Language() {
    return (
        <div className="settings-language">
            <label className='language-text'>Language :</label>
            <select className='language-options-container'>
                <option className='language-options-text'>English</option>
            </select>
        </div>
    )
}

export default Language;