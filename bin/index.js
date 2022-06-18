#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const simple_git_1 = __importDefault(require("simple-git"));
const owner = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logResult = yield getLogs(options);
        const parsed = logResult.all.reduce((p, c) => {
            p[c.author_name] = p[c.author_name] || [];
            p[c.author_name].push(c);
            return p;
        }, {});
        const result = Object.keys(parsed)
            .map((k) => ({
            author: k,
            commits: parsed[k].length,
        }))
            .sort((a1, a2) => a2.commits - a1.commits);
        console.log(JSON.stringify(result));
    }
    catch (error) {
        console.error(error);
        throw error;
    }
});
function hotSpots(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const git = getSimpleGit();
        const commands = ['log', '--pretty=format:', '--name-only'];
        if (options.context) {
            commands.push('--');
            commands.push(options.context);
        }
        const logResult = yield git.raw(commands);
        let result = logResult
            .split('\n')
            .filter((r) => r !== '')
            .reduce((p, c) => {
            let item = p.find((r) => r.file === c);
            if (!item) {
                item = { file: c, commits: 0 };
                p.push(item);
            }
            item.commits++;
            return p;
        }, [])
            .sort((a1, a2) => a2.commits - a1.commits);
        if (options.number) {
            result = result.slice(0, options.number);
        }
        console.log(JSON.stringify(result));
    });
}
/**
 * Retrieves the logs of the given context.
 * @param options Specifies the options to use
 * @returns a list of logs
 */
function getLogs(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const git = getSimpleGit();
        const logResult = yield git.log({
            file: options.context,
        });
        return logResult;
    });
}
function getSimpleGit() {
    const gitOptions = {
        binary: 'git',
        maxConcurrentProcesses: 6,
    };
    const git = (0, simple_git_1.default)(gitOptions);
    return git;
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .name('git-analyzer')
            .description('CLI for analyzing git repositories')
            .version('0.1.0');
        program
            .command('hot-spots')
            .description('Find the most frequently modified files.')
            .requiredOption('-c, --context <context>', 'The file or directory to analyze', '.')
            .option('-n, --number [number]', 'The number of entries to return')
            .action(hotSpots);
        program
            .command('owner')
            .description('Find the author who has modified a specified file or directory the most.')
            .requiredOption('-c, --context <context>', 'The file or directory to analyze', '.')
            .action(owner);
        program.parse();
    });
}
run();
