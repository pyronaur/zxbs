import Anthropic from "@anthropic-ai/sdk";
import { $, ansis } from "bunmagic";

const anthropic = new Anthropic({
  apiKey: Bun.env.ANTHROPIC_API_KEY,
});

async function stageAllChanges(): Promise<void> {
  await $`git add -A`.quiet();
  console.log(ansis.green("All changes have been staged."));
}

async function getUncommittedChanges(): Promise<string> {
  return (await $`git diff --staged`.quiet().text()).trim();
}

async function generateCommitMessages(changes: string): Promise<string[]> {
  const message = await anthropic.messages.create({
    max_tokens: 4096,
    system:
      "You are a helpful assistant that generates git commit messages." +
      "You should generate only 3 commit message variants based on the provided git log." +
      "Each line is a commit message, do not use any ordering or markdown." +
      "Each commit message should be 8 words or less." +
      "Example output: " +
      "build only if upstream version doesn't already exist\n" +
	  "Only build if upstream version doesn't already exist\n" +
	  "Check if upstream version exists before building\n",
    messages: [
      {
        role: "user",
        content: changes,
      },
    ],
    model: "claude-3-sonnet-20240229",
  });

  const text = message.content[0].text.trim();
  return text.split("\n").map((line: string) => line.trim());
}

async function commitChanges(message: string): Promise<void> {
  await $`git commit -m ${message}`.quiet();
  console.log(ansis.green("Changes committed successfully!"));
}

async function main() {
  await stageAllChanges();
  const changes = await getUncommittedChanges();

  if (!changes) {
    console.log(ansis.yellow("No changes to commit."));
    return;
  }

  let messages = await generateCommitMessages(changes);
  let selectedMessage = "";

  while (!selectedMessage) {
    const options = [...messages, "Regenerate"];
    const choice = await select(
      "Select a commit message or regenerate:",
      options
    );

    if (choice === "Regenerate") {
      const suggestions = prompt(
        "Please provide suggestions or feedback for improvement:"
      );
      messages = await generateCommitMessages(
        `${changes}\n\nPrevious suggestions: ${messages.join(
          ", "
        )}\n\nUser feedback: ${suggestions}`
      );
    } else {
      selectedMessage = choice;
    }
  }

  console.log(ansis.bold(`\nSelected commit message:\n${selectedMessage}\n`));
  const userResponse = ack("Do you want to use this commit message?");

  if (!userResponse) {
    console.log(ansis.yellow("Commit cancelled."));
    return;
  }

  await commitChanges(selectedMessage);
}

await main();
