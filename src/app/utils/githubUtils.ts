import {Config} from '../components/СonfigForm';
import {Octokit} from '@octokit/core';

const COMMIT_MESSAGE = 'Updating design system styles';
// const PULL_REQUEST_TITLE = 'Updating design system styles';

export type File = {
  path: string;
  content: string;
};

type MultipleFilesCommitter = (options: Config, files: File[]) => Promise<void>;
export const commitMultipleFiles: MultipleFilesCommitter = async (
  options,
  files
) => {
  const octokit = new Octokit({auth: options.token});
  const owner = options.ownerName;
  const repo = options.repoName;

  let head: any;
  const fetchTree = () =>
    octokit
      .request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
        owner,
        repo,
        ref: options.headBranch,
      })
      .then((commit: any) => {
        head = commit.data;
        return octokit.request(
          'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
          {
            owner,
            repo,
            tree_sha: commit.data.object.sha,
          }
        );
      });

  Promise.all(
    files.map(file =>
      // create blobs for the files
      octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
        owner,
        repo,
        content: file.content,
      })
    )
  )
    // put blobs on the trees
    .then((blobs: any) =>
      fetchTree().then(() =>
        octokit.request('POST /repos/{owner}/{repo}/git/trees', {
          owner,
          repo,
          tree: files.map((file: File, index) => {
            // needed for typescript
            const type: 'tree' | 'blob' | 'commit' = 'blob';
            const mode: '100644' | '100755' | '040000' | '160000' | '120000' =
              '100644';
            return {
              path: file.path,
              mode,
              type,
              sha: blobs[index].data.sha,
            };
          }),
          // base_tree: tree.data.sha,
        })
      )
    )
    // commit every tree
    .then((tree: any) =>
      octokit.request('POST /repos/{owner}/{repo}/git/commits', {
        owner,
        repo,
        message: COMMIT_MESSAGE,
        tree: tree.data.sha,
        parents: [head.object.sha],
      })
    )
    // update the reference
    .then((commit: any) =>
      octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{ref}', {
        owner,
        repo,
        ref: options.headBranch,
        sha: commit.data.sha,
      })
    );
};
