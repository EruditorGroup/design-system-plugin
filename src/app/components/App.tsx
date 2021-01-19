import * as React from 'react';
import {useState} from 'react';
import '../styles/ui.css';
import ConfigForm, {Config, EventData} from './СonfigForm';

const asyncMethod = (url: RequestInfo, token: string, method: string, body?: string | undefined) => {
  return fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
    },
    method,
    body,
  }).then(response => {
    if (!response.ok) {
      throw new Error(`Ошибка в запросе ${url}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  });
};

const getLastFileSha = (config: Config) => {
  return asyncMethod(`${config.repoPath}/contents/styles.json?ref=${config.headBranch}`, config.token, 'GET');
};

const commitChangesToHeadBranch = (config: Config, event: EventData, sha: string) => {
  return asyncMethod(`${config.repoPath}/contents/styles.json`, config.token, 'PUT',
    JSON.stringify({
      message: 'applying Figma styles update',
      content: window.btoa(event.data.pluginMessage.content),
      branch: config.headBranch,
      committer: {
        name: config.committerName,
        email: config.committerEmail,
      },
      sha,
    }));
};

const makePullRequestFromHeadBranch = (config: Config) => {
  const repoNameParsed = config.repoPath.split('/');

  return asyncMethod(`${config.repoPath}/pulls`, config.token, 'POST',
    JSON.stringify({
      owner: config.committerName,
      repo: repoNameParsed[repoNameParsed.length - 1],
      head: config.headBranch,
      base: config.baseBranch,
      title: 'Update styles',
    }));
};


const sendStylesToGithub = (event: EventData, config?: Config) => {
  return config && getLastFileSha(config)
    .then(json => json.sha)
    .then(sha => commitChangesToHeadBranch(config, event, sha))
    .then(() => makePullRequestFromHeadBranch(config));
};

const createEmptyConfig = () => {
  return {
    repoPath: '',
    token: '',
    committerName: '',
    committerEmail: '',
    headBranch: '',
    baseBranch: '',
  };
};

const App: React.FC = () => {
  const [cachedConfig, setCachedConfig] = useState(createEmptyConfig());
  const [isLoading, setLoading] = useState(false);
  const [errorLog, setErrorLog] = useState('');
  const [successLog, setSuccessLog] = useState('');

  React.useEffect(() => {
    parent.postMessage({pluginMessage: {type: 'getConfig'}}, '*');
    const listener = (event: EventData) => {
      if (event.data.pluginMessage.type === 'networkRequest') {
        const config = event.data.pluginMessage.config;
        setLoading(true);
        sendStylesToGithub(event, config)?.then(closePlugin).catch(error => {
          setLoading(false);
          setErrorLog(error.toString());
        });
      }

      if (event.data.pluginMessage.type === 'githubConfig') {
        // @ts-ignore
        setCachedConfig(event.data.pluginMessage.content);
      }
    };
    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    }
  }, []);

  const closePlugin = () => {
    setLoading(false);
    setSuccessLog('Успешно отправлено!');
    setTimeout(() => window.parent.postMessage({pluginMessage: {type: 'done'}}, '*'), 1000);
  };

  return (
    <div>
      <h2 className="header">Синхронизировать дизайн с кодом?</h2>
      <ConfigForm cachedConfig={cachedConfig}/>
      {isLoading ? (
        <p>Loading...</p>
      ) : errorLog.length > 0 ? (
        <p className="error-message">{errorLog}</p>
      ) : (
        <p className="success-message">{successLog}</p>
      )}
    </div>
  );
};

export default App;
