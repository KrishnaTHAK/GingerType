import './MainBody.css';
import TextContainer from './MainComponent/TextContainer.jsx';
import Language from './MainComponent/Language.jsx';
import TestDuration from './MainComponent/TestDuration.jsx';
import History from './MainComponent/History.jsx';
import TextSelection from './MainComponent/TextSelection.jsx';

function MainBody() {
    return (
        <main>
            <TextContainer />
            
            <div className="settings-sidebar">
                <Language />
                <TestDuration />
                <TextSelection />
                <History />
            </div>
        </main>
    );
}

export default MainBody;