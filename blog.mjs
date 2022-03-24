#!/usr/bin/env zx
import { site } from './utils/site.mjs';
const name = "blog";
const path = `${os.homedir()}/Projects/Sites/pyronaur.com`;
await site(name, path);

