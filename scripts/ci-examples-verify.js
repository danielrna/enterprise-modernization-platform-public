#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DOCS = 'docs/ci-examples.md';
const IMAGE = 'emp-cli';
const OUT_ROOT = 'reports/ci-examples';

const examples = [
  {
    name: 'GitLab CI',
    out: `${OUT_ROOT}/gitlab`,
    command: ['docker', 'run', '--rm', '-v', `${process.cwd()}:/workspace`, IMAGE, 'analyze', '.', '--pack', 'spring-boot-3-readiness', '--out', `${OUT_ROOT}/gitlab`],
    docsPatterns: [/GitLab CI/, /CI_PROJECT_DIR/, /artifacts:/]
  },
  {
    name: 'Jenkins',
    out: `${OUT_ROOT}/jenkins`,
    command: ['docker', 'run', '--rm', '-v', `${process.cwd()}:/workspace`, IMAGE, 'analyze', '.', '--pack', 'spring-boot-3-readiness', '--out', `${OUT_ROOT}/jenkins`],
    docsPatterns: [/Jenkins/, /archiveArtifacts/, /\$PWD:\/workspace/]
  },
  {
    name: 'Azure DevOps',
    out: `${OUT_ROOT}/azure`,
    command: ['docker', 'run', '--rm', '-v', `${process.cwd()}:/workspace`, IMAGE, 'analyze', '.', '--pack', 'spring-boot-3-readiness', '--out', `${OUT_ROOT}/azure`],
    docsPatterns: [/Azure DevOps/, /Build\.SourcesDirectory/, /publish: emp-report/]
  }
];

const docs = await fs.readFile(DOCS, 'utf8');
for (const example of examples) {
  for (const pattern of example.docsPatterns) {
    if (!pattern.test(docs)) throw new Error(`${DOCS} is missing ${pattern} for ${example.name}`);
  }
}

await run('Build EMP image used by CI examples', ['docker', 'build', '-t', IMAGE, '.']);

const results = [];
for (const example of examples) {
  await fs.rm(example.out, { recursive: true, force: true });
  await run(`${example.name} command-equivalent readiness run`, example.command);
  await assertReport(example);
  results.push({
    name: example.name,
    status: 'command_equivalent_verified',
    report: `${example.out}/index.html`,
    json: `${example.out}/report.json`
  });
}

await fs.mkdir(OUT_ROOT, { recursive: true });
await fs.writeFile(path.join(OUT_ROOT, 'validation.json'), `${JSON.stringify({
  schemaVersion: 'emp.ci-example-validation.v1',
  generatedAt: new Date().toISOString(),
  hostedValidation: false,
  summary: 'GitLab CI, Jenkins, and Azure DevOps examples were validated locally through command-equivalent Docker readiness runs.',
  results
}, null, 2)}\n`);

console.log('CI example command-equivalent verification passed.');

async function run(name, command) {
  console.log(`\n==> ${name}`);
  console.log(command.join(' '));
  const exitCode = await new Promise((resolve) => {
    const child = spawn(command[0], command.slice(1), { stdio: 'inherit' });
    child.on('close', resolve);
  });
  if (exitCode !== 0) throw new Error(`${name} failed with exit code ${exitCode}`);
}

async function assertReport(example) {
  const html = await fs.readFile(path.join(example.out, 'index.html'), 'utf8');
  const report = JSON.parse(await fs.readFile(path.join(example.out, 'report.json'), 'utf8'));
  if (!html.includes('Readiness Report')) throw new Error(`${example.name} HTML report is missing the report title.`);
  if (!html.includes('Evidence')) throw new Error(`${example.name} HTML report is missing evidence.`);
  if (report.schemaVersion !== 'emp.report.v1') throw new Error(`${example.name} JSON report has unexpected schemaVersion.`);
  if (report.pack !== 'spring-boot-3-readiness') throw new Error(`${example.name} JSON report has unexpected pack.`);
}
