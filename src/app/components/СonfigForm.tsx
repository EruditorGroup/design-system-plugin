import * as React from 'react';
import {useInput} from '../hooks/inputHook';
import {FormEvent} from 'react';

export type Config = {
  repoPath: string;
  token: string;
  committerName: string;
  committerEmail: string;
  headBranch: string;
  baseBranch: string;
};

export type EventData = {
  data: {
    pluginMessage: {
      content: string;
      type?: string;
      config?: Config;
      fileName: string;
    };
  };
};

type Props = {
  cachedConfig: Config;
};

const ConfigForm: React.FC<Props> = props => {
  const [repoPath, setRepoPath, bindRepoPath] = useInput('');
  const [token, setToken, bindToken] = useInput('');
  const [committerName, setCommitterName, bindCommitterName] = useInput('');
  const [committerEmail, setCommitterEmail, bindCommitterEmail] = useInput('');
  const [headBranch, setHeadBranch, bindHeadBranch] = useInput('');
  const [baseBranch, setBaseBranch, bindBaseBranch] = useInput('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const config = {
      repoPath,
      token,
      committerName,
      committerEmail,
      headBranch,
      baseBranch,
    };
    parent.postMessage({pluginMessage: {type: 'send', config}}, '*');
  };

  React.useEffect(() => {
    setRepoPath(props.cachedConfig.repoPath);
    setToken(props.cachedConfig.token);
    setCommitterName(props.cachedConfig.committerName);
    setCommitterEmail(props.cachedConfig.committerEmail);
    setHeadBranch(props.cachedConfig.headBranch);
    setBaseBranch(props.cachedConfig.baseBranch);
  }, [props.cachedConfig]);

  return (
    <form onSubmit={handleSubmit}>
      <label className="form-label">
        Repo path:
        <input type="text" {...bindRepoPath} />
      </label>
      <label className="form-label">
        Github token:
        <input type="text" {...bindToken} />
      </label>
      <label className="form-label">
        Committer name:
        <input type="text" {...bindCommitterName} />
      </label>
      <label className="form-label">
        Committer email:
        <input type="text" {...bindCommitterEmail} />
      </label>
      <label className="form-label">
        Head branch:
        <input type="text" {...bindHeadBranch} />
      </label>
      <label className="form-label">
        Base branch:
        <input type="text" {...bindBaseBranch} />
      </label>
      <button type="submit" value="Submit" className="submit-button">
        Отправить
      </button>
    </form>
  );
};

export default ConfigForm;
