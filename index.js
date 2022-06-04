require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const { mkdir } = require('fs/promises');
const { promisify } = require('util');

const execAsync = promisify(exec);

const { HOST, DEFAULT_BRANCH, DEPENDENCIES } = process.env;

const projects = [
  {
    userOrGroup: '',
    repository: '',
  },
];

const rootPath = process.cwd();
const updateRepositories = async () => {
  for (const project of projects) {
    try {
      console.log(project);
      await mkdir(project.userOrGroup, { recursive: true });
      process.chdir(project.userOrGroup);
      await execAsync(
        `git clone ${HOST}/${project.userOrGroup}/${project.repository}`,
      );
      process.chdir(project.repository);
      await execAsync('git config --get remote.origin.url');
      await execAsync(`git checkout ${DEFAULT_BRANCH}`);
      await execAsync('git checkout -b update-dependencies');

      await execAsync(`npm install --save-exact ${DEPENDENCIES}`);

      await execAsync('git add .');
      await execAsync('git commit -m "chore: update dependencies"');

      const { stdout, stderr } = await execAsync('git push --set-upstream origin update-dependencies');
      console.log({ stdout, stderr });
      process.chdir(rootPath);
    } catch (error) {
      const { stdout, stderr } = error;
      console.log({ stdout });
      console.log({ stderr });
      console.log({ error });
    }
  }
};

const deleteRepositories = () => {
  process.chdir(rootPath);
  const directories = [...new Set(projects.map((project) => project.userOrGroup))];
  directories.map((directory) => fs.rm(directory, { recursive: true, force: true }, (params) => {
    console.log({ params });
  }));
};
(async () => {
  await updateRepositories();
  deleteRepositories();
})();
