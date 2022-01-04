import { Application, Context, Octokit } from 'probot';
import { WebhookPayloadPullRequestPullRequest, WebhookPayloadPullRequest } from '@octokit/webhooks';

const DIVIDER = '######### PREFLIGHT #########';
const CHECKBOXES_RGX = /(- \[[x ]\] (?<task>.+))/gm;
const DONE_RGX = /(- \[[x]\] (?<task>.+))/;
const PENDING_RGX = /(- \[[ ]\] (?<task>.+))/;
const TASK_DEFS_RGX = /^\[\](\((.*)\))?:(.*)/gm
const TASK_DEF_RGX = /^\[\](\((?<branches>.*)\))?:(?<task>.*)/

export = (app: Application) => {
  app.on(['pull_request.opened', 'pull_request.edited', 'pull_request.synchronize'], async (context: Context<WebhookPayloadPullRequest>) => {
    const startTime = new Date();

    if (context.isBot) {
      return;
    }

    const pr = context.payload.pull_request;
    const existingTaskStates = getExistingTaskStates(pr.body);
    const commits = await context.github.pulls.listCommits({
      pull_number: context.payload.number,
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name
    });
    const commitTasks = getCommitTasks(commits, pr.base.ref);
    const existingTasks = Object.keys(existingTaskStates);

    const redundantTasks = existingTasks.filter(t => commitTasks.indexOf(t) === -1);
    redundantTasks.forEach(rt => {
      delete existingTaskStates[rt];
    });
    const missingTasks = commitTasks.filter(t => existingTasks.indexOf(t) === -1);
    missingTasks.forEach(mt => {
      existingTaskStates[mt] = false;
    });

    await createPrCheck(context, pr, existingTaskStates, startTime);
    await updatePrBodyIfNeeded(context, pr.body, existingTaskStates);
  });
}

function getExistingTaskStates(prBody: string): any {
  const hasDivider = prBody.indexOf(DIVIDER) !== -1;
  let existingTasks: any = {};

  if (hasDivider) {
    const tasksPart = prBody.split(DIVIDER)[1];
    const tasks = tasksPart.match(CHECKBOXES_RGX) || [];
    tasks.forEach(task => {
      let done = true;
      let matches = task.match(DONE_RGX)?.groups;
      if (!matches) {
        done = false;
        matches = task.match(PENDING_RGX)?.groups;
      }

      const taskText: string = matches ? matches["task"] : '';
      existingTasks[taskText] = done;
    });
  }

  return existingTasks;
}

function getCommitTasks(commits: Octokit.Response<Octokit.PullsListCommitsResponse>,
  forBranch: string): string[] {
  const tasks = [];
  for (const commit of commits.data) {
    const message = commit.commit.message;
    const matches = message.match(TASK_DEFS_RGX) || [];
    for (const match of matches || []) {
      const found = match.match(TASK_DEF_RGX)?.groups || {};
      const branches = found.branches ? found.branches.split('|') : [];
      if (found.task &&
        (branches.length == 0 || branches.indexOf(forBranch) !== -1)) {
        tasks.push(`${found.task.trim()} ([${commit.sha.substr(0, 7)}](${commit.html_url}))`);
      }
    }
  }
  return tasks;
}


function tasksToComment(taskState: object): string | undefined {
  const result = [DIVIDER];
  const entires = Object.entries(taskState);
  if (entires.length == 0)
    return undefined;
  entires.forEach(entry => {
    const [key, value] = entry;
    const taskLine = `- [${value ? 'x' : ' '}] ${key}`;
    result.push(taskLine);
  });
  result.push(`\r\n${DIVIDER}`);
  return result.join('\r\n');
}

async function createPrCheck(context: Context<WebhookPayloadPullRequest>, pr: WebhookPayloadPullRequestPullRequest, existingTaskStates: object, startTime: Date) {
  var pendingTasks = Object.entries(existingTaskStates).filter(e => !!!e[1]).map(e => e[0]);
  const check: Octokit.ChecksCreateParams = {
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    name: 'Preflight',
    head_sha: pr.head.sha,
    started_at: startTime.toISOString(),
    conclusion: 'failure',
    output: {
      title: 'Outstanding tasks',
      summary: 'Some Preflight tasks have been marked as completed',
      text: `These tasks are currently still pending completion:\r\n${pendingTasks.join('\r\n')}`
    }
  };

  if (pendingTasks.length === 0) {
    check.conclusion = 'success';
    check.completed_at = (new Date).toISOString();
    check.output ? check.output.title = 'Tasks completed' : null;
    check.output ? check.output.summary = 'All Preflight tasks have been completed 🚀' : null;
  };

  await context.github.checks.create(check);
}

async function updatePrBodyIfNeeded(context: Context<WebhookPayloadPullRequest>, oldBody: string, existingTaskStates: object) {
  const newTasksMd = tasksToComment(existingTaskStates)?.trim();
  let newPrBody = oldBody;
  if (oldBody.indexOf(DIVIDER) === -1) {
    newPrBody = `${oldBody}${(newTasksMd ? `\r\n${newTasksMd}` : '')}`.trim();
  }
  else {
    const parts = oldBody.split(DIVIDER);
    newPrBody = [parts[0], newTasksMd, parts[2]].join('\r\n').trim();
  }

  if (newPrBody !== oldBody) {
    await context.github.pulls.update({
      pull_number: context.payload.number,
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      body: newPrBody
    });
  }
}