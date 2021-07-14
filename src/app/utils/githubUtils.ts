import {Config} from '../components/СonfigForm';
import {Octokit} from '@octokit/core';

export type File = {
  path: string;
  content: string;
};

type GitType = 'tree' | 'blob' | 'commit';
type CommitMode = '100644' | '100755' | '040000' | '160000' | '120000';

const COMMIT_MESSAGE = 'Updating design system styles';
// const PULL_REQUEST_TITLE = 'Updating design system styles';

type MultipleFilesCommitter = (options: Config, files: File[]) => Promise<void>;
export const commitMultipleFiles: MultipleFilesCommitter = async (
  options,
  files
) => {
  const {ownerName: owner, repoName: repo, headBranch: ref, token} = options;
  const octokit = new Octokit({auth: token});
  const type: GitType = 'blob';
  const mode: CommitMode = '100644';

  // get last tree
  const reference = await octokit.request(
    'GET /repos/{owner}/{repo}/git/ref/heads/{ref}',
    {
      owner,
      repo,
      ref,
    }
  );
  const tree = await octokit.request(
    'GET /repos/{owner}/{repo}/git/trees/{treeSha}',
    {
      owner,
      repo,
      treeSha: reference.data.object.sha,
    }
  );

  // create blobs for the files
  const blobs = await Promise.all(
    files.map(file =>
      // create blobs for the files
      octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
        owner,
        repo,
        content: file.content,
      })
    )
  );

  // put blobs on the tree
  const newTree = await octokit.request(
    'POST /repos/{owner}/{repo}/git/trees',
    {
      owner,
      repo,
      tree: files.map((file, index) => {
        return {
          path: file.path,
          mode,
          type,
          sha: blobs[index].data.sha,
        };
      }),
      base_tree: tree.data.sha,
    }
  );

  // commit the tree
  const commit = await octokit.request(
    'POST /repos/{owner}/{repo}/git/commits',
    {
      owner,
      repo,
      message: COMMIT_MESSAGE,
      tree: newTree.data.sha,
      parents: [reference.data.object.sha],
    }
  );

  // update the reference
  await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{ref}', {
    owner,
    repo,
    ref,
    sha: commit.data.sha,
  });
};
