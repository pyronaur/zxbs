#!/usr/bin/env zx
import { AstroManager } from './utils/astro-manager.mjs';
const name = "blog";
const path = `${os.homedir()}/Projects/Sites/pyronaur.com`;
await AstroManager(name, path);

