import requestLocalDirectoryAccess from './requestLocalDirectoryAccess';

const requestDocusaurusRootAcess = async (displayInfo: boolean = true) => {
    if (displayInfo) {
        window.alert(
            'Wähle den Projekt-Ordner aus (der Ordner, in welchem sich "docusaurus.config.ts" befindet).'
        );
    }
    return await requestLocalDirectoryAccess('readwrite', ['docusaurus.config.ts']);
};
export default requestDocusaurusRootAcess;
