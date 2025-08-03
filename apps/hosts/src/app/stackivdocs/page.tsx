import { Breadcrumb } from '@common/Breadcrumb';

import { Ask } from './Ask';
import { AskHeader } from './components/AskHeader';

export default async function StackivDocsPage() {
    return (
        <div>
            <div className='p-5'>
                <div className='shadow-sm border-base-100 p-5'><Breadcrumb /></div>
            </div>
            <AskHeader />
            <Ask />
        </div>
    );
}
