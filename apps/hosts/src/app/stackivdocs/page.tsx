import { Ask } from './Ask';
import { AskHeader } from './components/AskHeader';

export default async function StackivDocsPage() {
    return (
        <div>
            <AskHeader />
            <Ask />
        </div>
    );
}
