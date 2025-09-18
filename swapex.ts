/**
 * Swap between Codex auth JSON Files
 */
import 'bunmagic/globals';

const AUTH_FILE = `${$HOME}/.codex/auth.json`
const SESSIONS = `${$HOME}/.codex/sessions.json`;


type Session = {
	"OPENAI_API_KEY": string | null,
	"tokens": {
	  "id_token": string,
	  "access_token": string
	  "refresh_token": string,
	  "account_id": string
	},
	"last_refresh": string
  }

type Sessions = Record<string, Session>;

const authFile = SAF.from(AUTH_FILE);
const sessionsFile = SAF.from(SESSIONS);

function hasContent(candidate: Session | undefined): boolean {
    return !!candidate && Object.keys(candidate as Record<string, unknown>).length > 0;
}

function getAccountId(candidate: Session | undefined): string | undefined {
    const id = candidate?.tokens?.id_token;
    if (typeof id === 'string') {
        const trimmed = id.trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return undefined;
}

function findLabelByAccountId(sessions: Sessions, accountId: string | undefined): string | undefined {
	if (!accountId) {
		return undefined;
	}

	for (const [label, data] of Object.entries(sessions)) {
        const id = getAccountId(data);
		if (id === accountId) {
			return label;
		}
	}

	return undefined;
}

function reorderLabels(labels: string[], first?: string): string[] {
	if (!first) {
		return labels;
	}

	const filtered = labels.filter(label => label !== first);
	return [first, ...filtered];
}

async function readSessions(): Promise<Sessions> {
	try {
        return await sessionsFile.json<Sessions>();
	} catch {
		return {};
	}
}

async function readCurrentAuth(): Promise<Session | undefined> {
	try {
		return await authFile.file.json();
	} catch {
		return;
	}
}

async function writeSessions(sessions: Sessions): Promise<void> {
	await sessionsFile.ensureDirectory();
	await sessionsFile.json<Sessions>(sessions);
}

async function writeAuth(auth: Session): Promise<void> {
	await authFile.ensureDirectory();
	await authFile.json(auth);
}

async function ensureCurrentLabel(
    sessions: Sessions,
    currentAuth: Session | undefined,
): Promise<string | undefined> {
    if (!currentAuth || hasContent(currentAuth) === false) {
        return undefined;
    }

    const accountId = getAccountId(currentAuth);
    const existing = findLabelByAccountId(sessions, accountId);
    if (existing) {
        sessions[existing] = currentAuth;
        await writeSessions(sessions);
        return existing;
    }

    const suggested = accountId || '';
    const name = await ask('Name this session', suggested, 'required');
    sessions[name] = currentAuth;
    await writeSessions(sessions);
    return name;
}

// Main flow
const sessions = await readSessions();
const currentAuth = await readCurrentAuth();
const currentLabel = await ensureCurrentLabel(sessions, currentAuth);

// Build selection list (labels + Logout). Place current label first if exists
const labels = Object.keys(sessions);
const orderedLabels = reorderLabels(labels, currentLabel);
const logoutOption = 'Logout';
const choice = await select('Select a session to use', [...orderedLabels, logoutOption]);

if (choice === logoutOption) {
	// Remove auth.json to logout
	await authFile.delete();
} else {
	// Switch to the chosen session
	const selected = sessions[choice];
	if (selected && typeof selected === 'object') {
		await writeAuth(selected);
	} else {
		// If the selected label somehow doesn't exist, keep current auth as-is
		// but ensure sessions are persisted
		await writeSessions(sessions);
	}
}
