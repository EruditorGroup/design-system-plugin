import * as React from 'react';
import {useState} from 'react';
import '../styles/ui.css';
import ConfigForm, {EventData} from './СonfigForm';
import {commitMultipleFiles} from '../utils/githubUtils';

const SUCCESS_LOG_MESSAGE = 'Успешно отправлено!';
const GET_CONFIG_MESSAGE = 'GET_CONFIG_MESSAGE';
const NETWORK_REQUEST = 'NETWORK_REQUEST';
const GITHUB_CONFIG = 'GITHUB_CONFIG';

const App: React.FC = () => {
  const [cachedConfig, setCachedConfig] = useState({
    repoName: '',
    token: '',
    ownerName: '',
    headBranch: '',
    baseBranch: '',
  });
  const [isLoading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [successLog, setSuccessLog] = useState('');

  React.useEffect(() => {
    parent.postMessage({pluginMessage: {type: GET_CONFIG_MESSAGE}}, '*');
    const listener = (event: EventData) => {
      if (event.data.pluginMessage.type === NETWORK_REQUEST) {
        const config = event.data.pluginMessage.config;
        setLoading(true);
        commitMultipleFiles(config, event.data.pluginMessage.content)
          .then(() => {
            setLoading(false);
            setSuccessLog(SUCCESS_LOG_MESSAGE);
          })
          .catch(err => {
            setLoading(false);
            setErrorLog(err.toString());
          });
      }

      if (event.data.pluginMessage.type === GITHUB_CONFIG) {
        event.data.pluginMessage.config &&
          setCachedConfig(event.data.pluginMessage.config);
      }
    };
    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  return (
    <div>
      <h2 className="header">Синхронизировать дизайн с кодом?</h2>
      <ConfigForm cachedConfig={cachedConfig} />
      {isLoading ? (
        <p>Передаю обновления в код...</p>
      ) : errorLog.length ? (
        <p className="error-message">{errorLog}</p>
      ) : (
        <p className="success-message">{successLog}</p>
      )}
    </div>
  );
};

export default App;
