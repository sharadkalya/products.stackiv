import { getServerTranslation } from 'shared-i18n/server';

export async function AskHeader() {
    const { t } = await getServerTranslation('en');

    return (
        <div className='p-10 text-center pb-0'>
            <h1 className="text-3xl font-bold mb-4">{t('stackivDocsPage.title')}</h1>
            <p className="text-md text-center mb-8 leading-relaxed">
                {t('stackivDocsPage.description')}<br />
                {t('stackivDocsPage.uploadInstructions')}
            </p>
        </div>
    );
}
