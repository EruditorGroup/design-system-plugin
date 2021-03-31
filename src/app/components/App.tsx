import * as React from 'react';
import {useState} from 'react';
import '../styles/ui.css';
import ConfigForm, {Config, EventData} from './СonfigForm';
import {GET_CONFIG_MESSAGE, GITHUB_CONFIG, NETWORK_REQUEST} from '../constants';

const SUCCESS_LOG_MESSAGE = 'Успешно отправлено!';

type RequestCreator = (
  url: RequestInfo,
  token: string,
  method: string,
  body?: string | undefined
) => Promise<unknown>;
const asyncMethod: RequestCreator = (url, token, method, body) =>
  fetch(url, {
    headers: {
      Authorization: `token ${token}`,
    },
    method,
    body,
  }).then(response => {
    if (!response.ok) {
      throw new Error(
        `Ошибка в запросе ${url}: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  });

type LastFileShaGetter = (config: Config, fileName: string) => Promise<unknown>;
const getLastFileSha: LastFileShaGetter = (config, fileName) =>
  asyncMethod(
    `${config.repoPath}/${fileName}?ref=${config.headBranch}`,
    config.token,
    'GET'
  );

type ChangesToHeadBranchCommitter = (
  config: Config,
  event: EventData,
  sha?: string
) => Promise<unknown>;
const commitChangesToHeadBranch: ChangesToHeadBranchCommitter = (
  config,
  event,
  sha
) => {
  const fileName = event.data.pluginMessage.fileName;
  return asyncMethod(
    `${config.repoPath}/${fileName}`,
    config.token,
    'PUT',
    sha
      ? JSON.stringify({
          // TODO: change later to a title with tags, etc.
          message: 'applying Figma styles update',
          content: window.btoa(event.data.pluginMessage.content),
          branch: config.headBranch,
          committer: {
            name: config.committerName,
            email: config.committerEmail,
          },
          sha,
        })
      : JSON.stringify({
          // TODO: change later to a title with tags, etc.
          message: 'applying Figma styles update',
          content: window.btoa(event.data.pluginMessage.content),
          branch: config.headBranch,
          committer: {
            name: config.committerName,
            email: config.committerEmail,
          },
        })
  );
};

type PullRequestCreator = (config: Config) => Promise<unknown>;
const makePullRequestFromHeadBranch: PullRequestCreator = config => {
  const repoNameParsed = config.repoPath.split('/');

  return asyncMethod(
    `${config.repoPath}/pulls`,
    config.token,
    'POST',
    JSON.stringify({
      owner: config.committerName,
      repo: repoNameParsed[repoNameParsed.length - 1],
      head: config.headBranch,
      base: config.baseBranch,
      // TODO: change later to a title with tags, etc.
      title: 'Update styles',
    })
  );
};

type StylesSender = (event: EventData, config: Config) => Promise<unknown>;
const sendStylesToGithub: StylesSender = (event, config) =>
  config &&
  getLastFileSha(config, event.data.pluginMessage.fileName)
    .then(json => (json as {sha: string}).sha)
    .then(sha => commitChangesToHeadBranch(config, event, sha))
    .catch(() => commitChangesToHeadBranch(config, event));
// .then(() => makePullRequestFromHeadBranch(config));

const App: React.FC = () => {
  const [cachedConfig, setCachedConfig] = useState({
    repoPath: '',
    token: '',
    committerName: '',
    committerEmail: '',
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
        config &&
          sendStylesToGithub(event, config)
            // .then(closePlugin)
            .catch(error => {
              setLoading(false);
              setErrorLog(error.toString());
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

  const closePlugin = () => {
    setLoading(false);
    setSuccessLog(SUCCESS_LOG_MESSAGE);
    setTimeout(
      () => window.parent.postMessage({pluginMessage: {type: 'done'}}, '*'),
      1000
    );
  };

  return (
    <div>
      <h2 className="header">Синхронизировать дизайн с кодом?</h2>
      <ConfigForm cachedConfig={cachedConfig} />
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
