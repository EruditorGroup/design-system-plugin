import * as React from 'react';
import {useState} from 'react';
import '../styles/ui.css';
import ConfigForm, {EventData} from './СonfigForm';
import {commitMultipleFiles} from '../utils/githubUtils';

const SUCCESS_LOG_MESSAGE = 'Successfully synced';
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
            let pluginMessage = err.toString();
            if (err.errors && err.errors.length) {
              if (
                err.errors[0].resource === 'PullRequest' &&
                err.errors[0].message.match(/pull request already exists/)
              ) {
                pluginMessage =
                  SUCCESS_LOG_MESSAGE + ', but a pull request already exists.';
              }
            }
            setLoading(false);
            setErrorLog(pluginMessage);
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
      <h2 className="header">Sync design system with code?</h2>
      <ConfigForm cachedConfig={cachedConfig} />
      {isLoading ? (
        <p>Please wait...</p>
      ) : errorLog.length ? (
        <p className="error-message">{errorLog}</p>
      ) : (
        <p className="success-message">{successLog}</p>
      )}
    </div>
  );
};

export default App;
