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

async function generateCommitMessage(changes: string): Promise<string> {
  const message = await anthropic.messages.create({
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Create a git commit message based on the following changes:\n\n${changes}\n\n 3 Commit message variants (max 8 words each):`,
      },
    ],
    model: "claude-3-sonnet-20240229",
  });

  return message.content[0].text.trim();
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

  let commitMessage = await generateCommitMessage(changes);
  let isCommitAccepted = false;

  while (!isCommitAccepted) {
    console.log(ansis.bold(`\nProposed commit message:\n${commitMessage}\n`));
    const userResponse = await ack("Do you like this commit message?", "n");

    if (userResponse) {
      isCommitAccepted = true;
    } else {
      const options = ["Regenerate", "Edit manually", "Cancel"];
      const choice = await select("What would you like to do?", options);

      switch (choice) {
        case "Regenerate":
          const suggestions = await prompt(
            "Please provide suggestions or feedback for improvement:"
          );
          commitMessage = await generateCommitMessage(
            `${changes}\n\nPrevious suggestion: ${commitMessage}\n\nUser feedback: ${suggestions}`
          );
          break;
        case "Edit manually":
          commitMessage = await prompt("Please enter your own commit message:");
          isCommitAccepted = true;
          break;
        case "Cancel":
          console.log(ansis.yellow("Commit cancelled."));
          return;
      }
    }
  }

  await commitChanges(commitMessage);
}

await main();
