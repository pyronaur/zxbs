#!/usr/bin/env zx
import { AstroManager } from './utils/astro-manager.mjs';
const name = "owc";
const path = `${os.homedir()}/Projects/Sites/onwritingcode.com`;
await AstroManager(name, path);