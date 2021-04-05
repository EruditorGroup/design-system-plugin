import * as React from 'react';
import {useInput} from '../hooks/inputHook';
import {FormEvent} from 'react';
import {File} from '../utils/githubUtils';

export type Config = {
  repoName: string;
  token: string;
  ownerName: string;
  headBranch: string;
  baseBranch: string;
};

export type EventData = {
  data: {
    pluginMessage: {
      content: File[];
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
  const [repoName, setRepoName, bindRepoName] = useInput('');
  const [token, setToken, bindToken] = useInput('');
  const [ownerName, setOwnerName, bindOwnerName] = useInput('');
  const [headBranch, setHeadBranch, bindHeadBranch] = useInput('');
  const [baseBranch, setBaseBranch, bindBaseBranch] = useInput('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const config = {
      repoName,
      token,
      ownerName,
      headBranch,
      baseBranch,
    };
    parent.postMessage({pluginMessage: {type: 'send', config}}, '*');
  };

  React.useEffect(() => {
    setRepoName(props.cachedConfig.repoName);
    setToken(props.cachedConfig.token);
    setOwnerName(props.cachedConfig.ownerName);
    setHeadBranch(props.cachedConfig.headBranch);
    setBaseBranch(props.cachedConfig.baseBranch);
  }, [props.cachedConfig]);

  return (
    <form onSubmit={handleSubmit}>
      <label className="form-label">
        Repo name:
        <input type="text" {...bindRepoName} />
      </label>
      <label className="form-label">
        Github token:
        <input type="text" {...bindToken} />
      </label>
      <label className="form-label">
        Owner name:
        <input type="text" {...bindOwnerName} />
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
