#!/usr/bin/env node

import { Command } from 'commander';
import simpleGit, {
  DefaultLogFields,
  ListLogLine,
  SimpleGit,
  SimpleGitOptions,
} from 'simple-git';

interface AuthorResults {
  [key: string]: Array<DefaultLogFields & ListLogLine>;
}

interface HotSpotResult {
  file: string;
  commits: number;
}

interface AuthorCountResults {
  author: string;
  commits: number;
}

interface GitLogOptions {
  context: string;
}

interface HotSpotsOptions {
  context: string;
  number: number;
}

const owner = async (options: GitLogOptions) => {
  try {
    const logResult = await getLogs(options);

    const parsed: AuthorResults = logResult.all.reduce(
      (p: AuthorResults, c) => {
        p[c.author_name] = p[c.author_name] || [];
        p[c.author_name].push(c);
        return p;
      },
      {},
    );

    const result: Array<AuthorCountResults> = Object.keys(parsed)
      .map((k) => ({
        author: k,
        commits: parsed[k].length,
      }))
      .sort((a1, a2) => a2.commits - a1.commits);

    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function hotSpots(options: HotSpotsOptions) {
  const git: SimpleGit = getSimpleGit();

  const commands = ['log', '--pretty=format:', '--name-only'];

  if (options.context) {
    commands.push('--');
    commands.push(options.context);
  }

  const logResult = await git.raw(commands);

  let result = logResult
    .split('\n')
    .filter((r) => r !== '')
    .reduce((p, c) => {
      let item: HotSpotResult | undefined = p.find((r) => r.file === c);

      if (!item) {
        item = { file: c, commits: 0 };
        p.push(item);
      }

      item.commits++;

      return p;
    }, [] as Array<HotSpotResult>)
    .sort((a1, a2) => a2.commits - a1.commits);

  if (options.number) {
    result = result.slice(0, options.number);
  }

  console.log(JSON.stringify(result));
}

/**
 * Retrieves the logs of the given context.
 * @param options Specifies the options to use
 * @returns a list of logs
 */
async function getLogs(options: GitLogOptions) {
  const git: SimpleGit = getSimpleGit();

  const logResult = await git.log({
    file: options.context,
  });

  return logResult;
}

function getSimpleGit() {
  const gitOptions: Partial<SimpleGitOptions> = {
    binary: 'git',
    maxConcurrentProcesses: 6,
  };

  const git: SimpleGit = simpleGit(gitOptions);
  return git;
}

async function run() {
  const program = new Command();

  program
    .name('git-analyzer')
    .description('CLI for analyzing git repositories')
    .version('0.1.0');

  program
    .command('hot-spots')
    .description('Find the most frequently modified files.')
    .requiredOption(
      '-c, --context <context>',
      'The file or directory to analyze',
      '.',
    )
    .option('-n, --number [number]', 'The number of entries to return')
    .action(hotSpots);

  program
    .command('owner')
    .description(
      'Find the author who has modified a specified file or directory the most.',
    )
    .requiredOption(
      '-c, --context <context>',
      'The file or directory to analyze',
      '.',
    )
    .action(owner);

  program.parse();
}

run();
