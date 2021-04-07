import {Config} from '../components/СonfigForm';
import {Octokit} from '@octokit/core';
import { Endpoints } from "@octokit/types";

type listUserReposResponse = Endpoints["GET /repos/{owner}/{repo}"]["response"];

export type File = {
  path: string;
  content: string;
};

type gitType = 'tree' | 'blob' | 'commit';
type commitMode = '100644' | '100755' | '040000' | '160000' | '120000';

const COMMIT_MESSAGE = 'Updating design system styles';
// const PULL_REQUEST_TITLE = 'Updating design system styles';

type MultipleFilesCommitter = (options: Config, files: File[]) => Promise<void>;
export const commitMultipleFiles: MultipleFilesCommitter = async (
  options,
  files
) => {
  const octokit = new Octokit({auth: options.token});
  const owner = options.ownerName;
  const repo = options.repoName;
  const ref = options.headBranch;
  const type: gitType = 'blob';
  const mode: commitMode = '100644';

  let head: listUserReposResponse;

  // get last tree
  const reference = await octokit
    .request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
      owner,
      repo,
      ref,
    });
  head = reference.data;
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
  const newTree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner,
    repo,
    tree: files.map((file: File, index) => {
      return {
        path: file.path,
        mode,
        type,
        sha: blobs[index].data.sha,
      };
    }),
    base_tree: tree.data.sha,
  });

  // commit the tree
  const commit = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
    owner,
    repo,
    message: COMMIT_MESSAGE,
    tree: newTree.data.sha,
    parents: [head.object.sha],
  });

  // update the reference
  await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{ref}', {
    owner,
    repo,
    ref,
    sha: commit.data.sha,
  });
};
