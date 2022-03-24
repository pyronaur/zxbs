#!/usr/bin/env zx
import { site } from './utils/site.mjs';
const name = "owc";
const path = `${os.homedir()}/Projects/Sites/OnWritingCode.com`;
await site(name, path);

