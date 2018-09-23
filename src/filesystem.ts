import * as Fs from 'fs';
import * as Strings from './strings';
import { Callback } from './general';
import {promisify} from "util";

namespace Dirent {
    export function isDotOrDotDot(suspect: string) {
        return suspect === '.' || suspect === '..';
    }
}

export type FindFileCB = Callback<Error, [string]>;

export function findFileCB(
    targetFileName: string,
    startPath:      string,
    callbackfn:     FindFileCB | null
) {
    let dirsToSearchAmount = 0;
    function findFileImpl(lookupPath: string) {
        ++dirsToSearchAmount;
        Fs.readdir(
            lookupPath,
            {withFileTypes: true},
            onDirectoryRead.bind(null, lookupPath)
        );
    }

    function forwardError(errDescr: string) {
        callbackfn!(new Error(errDescr), null);
        callbackfn = null;
    }
    function forwardSuccess(data: string) {
        callbackfn!(null, data);
        callbackfn = null;
    }

    function onDirectoryRead(
        lookupPath: string,
        err:        NodeJS.ErrnoException,
        dirents:    Fs.Dirent[]
    ){
        if (!callbackfn) {
            return;
        }
        if (err){
            forwardError(err.message);
            return;
        }
        for (const dirent of dirents) {
            if (dirent.isFile() && dirent.name === targetFileName){
                forwardSuccess(`${lookupPath}/${dirent.name}`);
                return;
            } else if (dirent.isDirectory() && !Dirent.isDotOrDotDot(dirent.name)){
                findFileImpl(`${lookupPath}/${dirent.name}`);
            }
        }
        if (!--dirsToSearchAmount) {
            forwardError(`no "${targetFileName}" file was found in "${startPath}"`);
        }
    }

    if (Strings.containsSlashes(targetFileName = targetFileName.trim())) {
        forwardError(`target filename ${targetFileName} contains slashes`);
    } else {
        findFileImpl(startPath);
    }
}

const readDirAsync = promisify(Fs.readdir);

export async function findFile(
    targetFileName: string,
    startPath:      string
): Promise<string | null> {
    if (Strings.containsSlashes(targetFileName = targetFileName.trim())) {
        throw new Error(`target filename ${targetFileName} contains slashes`);
    }

    let dirs: Fs.Dirent[] = [];
    for (const dirent of await readDirAsync(startPath,{ withFileTypes: true })) {
        if (dirent.isFile() && dirent.name === targetFileName){
            return `${startPath}/${dirent.name}`;
        } else if (dirent.isDirectory() && !Dirent.isDotOrDotDot(dirent.name)) {
            dirs.push(dirent);
        }
    }
    for (const dir of dirs) {
        const filePath = await findFile(targetFileName,`${startPath}/${dir.name}`);
        if (filePath) {
            return filePath;
        }
    }
    return null;
}

